import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { API_FORBIDDEN_PROFILE } from "@/lib/http/api-forbidden";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MONTH_LABELS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: API_FORBIDDEN_PROFILE }, { status: 403 });
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const startOfMonth = new Date(currentYear, now.getMonth(), 1);
  const startOfPrevMonth = new Date(currentYear, now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(currentYear, now.getMonth(), 1);

  // Active subscriptions
  const activeSubs = await prisma.schoolSubscription.findMany({
    where: { status: "ATIVA" },
    include: {
      school: { select: { id: true, nome: true, slug: true, plano: true } },
      plan: { select: { id: true, nome: true, preco: true, slug: true } },
    },
    orderBy: { dataInicio: "desc" },
  });

  // All subscriptions this year for chart
  const subsThisYear = await prisma.schoolSubscription.findMany({
    where: { dataInicio: { gte: startOfYear } },
    select: { valorPago: true, dataInicio: true, status: true },
    orderBy: { dataInicio: "asc" },
  });

  // MRR = sum of active subscription prices
  const mrr = activeSubs.reduce((acc, s) => acc + Number(s.plan.preco), 0);
  const arr = mrr * 12;

  // Revenue this month (new subscriptions started this month)
  const revenueThisMonth = await prisma.schoolSubscription.aggregate({
    where: { dataInicio: { gte: startOfMonth } },
    _sum: { valorPago: true },
  });

  // Revenue prev month
  const revenuePrevMonth = await prisma.schoolSubscription.aggregate({
    where: { dataInicio: { gte: startOfPrevMonth, lt: endOfPrevMonth } },
    _sum: { valorPago: true },
  });

  // Revenue by month chart
  const receitaPorMes = Array.from({ length: 12 }, (_, i) => ({
    month: MONTH_LABELS[i], receita: 0, assinantes: 0,
  }));
  for (const s of subsThisYear) {
    const idx = new Date(s.dataInicio).getMonth();
    receitaPorMes[idx].receita += Number(s.valorPago);
    if (s.status === "ATIVA") receitaPorMes[idx].assinantes += 1;
  }

  // Revenue by plan
  const receitaPorPlano = await prisma.schoolSubscription.groupBy({
    by: ["planId"],
    where: { status: "ATIVA" },
    _count: { id: true },
    _sum: { valorPago: true },
  });

  const plans = await prisma.plan.findMany({ select: { id: true, nome: true, preco: true } });
  const planMap = Object.fromEntries(plans.map(p => [p.id, p]));

  const receitaPorPlanoFormatted = receitaPorPlano.map(r => ({
    planId: r.planId,
    planNome: planMap[r.planId]?.nome ?? "Desconhecido",
    assinantes: r._count.id,
    mrr: Number(planMap[r.planId]?.preco ?? 0) * r._count.id,
    receitaTotal: Number(r._sum.valorPago ?? 0),
  }));

  // Churn this month (cancelled this month)
  const churnThisMonth = await prisma.schoolSubscription.count({
    where: { status: "CANCELADA", dataFim: { gte: startOfMonth } },
  });

  const receitaMes = Number(revenueThisMonth._sum.valorPago ?? 0);
  const receitaPrevMes = Number(revenuePrevMonth._sum.valorPago ?? 0);
  const variacaoMes = receitaPrevMes > 0
    ? Number((((receitaMes - receitaPrevMes) / receitaPrevMes) * 100).toFixed(1))
    : receitaMes > 0 ? 100 : 0;

  return NextResponse.json({
    metricas: {
      mrr,
      arr,
      assinantesAtivos: activeSubs.length,
      receitaMes,
      receitaPrevMes,
      variacaoMes,
      churnThisMonth,
      taxaChurn: activeSubs.length > 0
        ? Number(((churnThisMonth / activeSubs.length) * 100).toFixed(1)) : 0,
    },
    receitaPorMes,
    receitaPorPlano: receitaPorPlanoFormatted,
    assinaturasAtivas: activeSubs.map(s => ({
      id: s.id,
      schoolId: s.schoolId,
      schoolNome: s.school.nome,
      schoolSlug: s.school.slug,
      planId: s.planId,
      planNome: s.plan.nome,
      planPreco: Number(s.plan.preco),
      valorPago: Number(s.valorPago),
      dataInicio: s.dataInicio,
      status: s.status,
    })),
  });
}
