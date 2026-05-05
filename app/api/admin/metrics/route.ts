import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MONTH_LABELS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function pct(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

type Period = "7d" | "30d" | "90d" | "12m" | "ytd";

function getPeriodBounds(period: Period): {
  start: Date; end: Date;
  prevStart: Date; prevEnd: Date;
  granularity: "day" | "month";
  chartPoints: number;
} {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case "7d": {
      const start = new Date(now); start.setDate(start.getDate() - 6); start.setHours(0,0,0,0);
      const prevEnd = new Date(start); prevEnd.setMilliseconds(-1);
      const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate() - 6); prevStart.setHours(0,0,0,0);
      return { start, end, prevStart, prevEnd, granularity: "day", chartPoints: 7 };
    }
    case "30d": {
      const start = new Date(now); start.setDate(start.getDate() - 29); start.setHours(0,0,0,0);
      const prevEnd = new Date(start); prevEnd.setMilliseconds(-1);
      const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate() - 29); prevStart.setHours(0,0,0,0);
      return { start, end, prevStart, prevEnd, granularity: "day", chartPoints: 30 };
    }
    case "90d": {
      const start = new Date(now); start.setDate(start.getDate() - 89); start.setHours(0,0,0,0);
      const prevEnd = new Date(start); prevEnd.setMilliseconds(-1);
      const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate() - 89); prevStart.setHours(0,0,0,0);
      return { start, end, prevStart, prevEnd, granularity: "month", chartPoints: 3 };
    }
    case "ytd": {
      const start = new Date(now.getFullYear(), 0, 1);
      const prevStart = new Date(now.getFullYear() - 1, 0, 1);
      const prevEnd = new Date(now.getFullYear(), 0, 1);
      return { start, end, prevStart, prevEnd, granularity: "month", chartPoints: now.getMonth() + 1 };
    }
    case "12m":
    default: {
      const start = new Date(now); start.setFullYear(start.getFullYear() - 1); start.setDate(1); start.setHours(0,0,0,0);
      const prevStart = new Date(start); prevStart.setFullYear(prevStart.getFullYear() - 1);
      const prevEnd = new Date(start);
      return { start, end, prevStart, prevEnd, granularity: "month", chartPoints: 12 };
    }
  }
}

function buildChartLabels(period: Period, bounds: ReturnType<typeof getPeriodBounds>): string[] {
  if (bounds.granularity === "day") {
    return Array.from({ length: bounds.chartPoints }, (_, i) => {
      const d = new Date(bounds.start);
      d.setDate(d.getDate() + i);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });
  }
  // month granularity
  if (period === "ytd" || period === "12m") {
    const labels: string[] = [];
    const cursor = new Date(bounds.start);
    for (let i = 0; i < bounds.chartPoints; i++) {
      labels.push(MONTH_LABELS[cursor.getMonth()]);
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return labels;
  }
  // 90d → 3 months
  return Array.from({ length: 3 }, (_, i) => {
    const d = new Date(bounds.start);
    d.setMonth(d.getMonth() + i);
    return MONTH_LABELS[d.getMonth()];
  });
}

function bucketByDay(items: { date: Date; value: number }[], start: Date, points: number) {
  const result = Array.from({ length: points }, () => 0);
  for (const item of items) {
    const diff = Math.floor((item.date.getTime() - start.getTime()) / 86400000);
    if (diff >= 0 && diff < points) result[diff] += item.value;
  }
  return result;
}

function bucketByMonth(items: { date: Date; value: number }[], start: Date, points: number) {
  const result = Array.from({ length: points }, () => 0);
  for (const item of items) {
    const startMonth = start.getFullYear() * 12 + start.getMonth();
    const itemMonth = item.date.getFullYear() * 12 + item.date.getMonth();
    const idx = itemMonth - startMonth;
    if (idx >= 0 && idx < points) result[idx] += item.value;
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const periodParam = (request.nextUrl.searchParams.get("period") ?? "30d") as Period;
    const validPeriods: Period[] = ["7d", "30d", "90d", "12m", "ytd"];
    const period: Period = validPeriods.includes(periodParam) ? periodParam : "30d";

    const bounds = getPeriodBounds(period);
    const { start, end, prevStart, prevEnd, granularity, chartPoints } = bounds;
    const labels = buildChartLabels(period, bounds);

    const [
      totalSchools,
      activeSchools,
      newInPeriod,
      newInPrevPeriod,
      totalUsers,
      totalAlunos,
      newAlunosInPeriod,
      newAlunosInPrevPeriod,
      totalMatriculas,
      activeMatriculas,
      inadimplentes,
      receitaPeriodo,
      receitaPeriodoAnterior,
      pagamentosChart,
      schoolsChart,
      alunosChart,
      planosCounts,
      topSchools,
    ] = await Promise.all([
      prisma.school.count(),
      prisma.school.count({ where: { ativo: true } }),
      prisma.school.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.school.count({ where: { createdAt: { gte: prevStart, lte: prevEnd } } }),
      prisma.user.count({ where: { ativo: true, role: { not: "SUPER_ADMIN" } } }),
      prisma.aluno.count(),
      prisma.aluno.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.aluno.count({ where: { createdAt: { gte: prevStart, lte: prevEnd } } }),
      prisma.matricula.count(),
      prisma.matricula.count({ where: { status: "ATIVA" } }),
      prisma.pagamento.count({ where: { status: "ATRASADO" } }),
      prisma.pagamento.aggregate({
        where: { status: "PAGO", dataPagamento: { gte: start, lte: end } },
        _sum: { valor: true },
      }),
      prisma.pagamento.aggregate({
        where: { status: "PAGO", dataPagamento: { gte: prevStart, lte: prevEnd } },
        _sum: { valor: true },
      }),
      prisma.pagamento.findMany({
        where: { status: "PAGO", dataPagamento: { gte: start, lte: end } },
        select: { valor: true, dataPagamento: true },
      }),
      prisma.school.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { createdAt: true },
      }),
      prisma.aluno.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { createdAt: true },
      }),
      prisma.school.groupBy({ by: ["plano"], _count: { id: true } }),
      prisma.school.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true, nome: true, slug: true, plano: true, ativo: true, createdAt: true,
          _count: { select: { alunos: true, matriculas: true, users: true } },
        },
      }),
    ]);

    // Build chart data
    const receitaItems = pagamentosChart
      .filter(p => p.dataPagamento)
      .map(p => ({ date: new Date(p.dataPagamento!), value: Number(p.valor) }));

    const schoolItems = schoolsChart.map(s => ({ date: new Date(s.createdAt), value: 1 }));
    const alunoItems  = alunosChart.map(a => ({ date: new Date(a.createdAt), value: 1 }));

    const bucket = granularity === "day" ? bucketByDay : bucketByMonth;

    const receitaBuckets = bucket(receitaItems, start, chartPoints);
    const schoolBuckets  = bucket(schoolItems, start, chartPoints);
    const alunoBuckets   = bucket(alunoItems, start, chartPoints);

    const chartData = labels.map((label, i) => ({
      label,
      receita: receitaBuckets[i],
      escolas: schoolBuckets[i],
      alunos:  alunoBuckets[i],
    }));

    const receitaVal     = Number(receitaPeriodo._sum.valor ?? 0);
    const receitaPrevVal = Number(receitaPeriodoAnterior._sum.valor ?? 0);

    return NextResponse.json({
      period,
      metricas: {
        totalSchools,
        activeSchools,
        inactiveSchools: totalSchools - activeSchools,
        newInPeriod,
        newVariacao: pct(newInPeriod, newInPrevPeriod),
        totalUsers,
        totalAlunos,
        newAlunosInPeriod,
        alunosVariacao: pct(newAlunosInPeriod, newAlunosInPrevPeriod),
        totalMatriculas,
        activeMatriculas,
        inadimplentes,
        taxaInadimplencia: totalMatriculas > 0
          ? Number(((inadimplentes / totalMatriculas) * 100).toFixed(1)) : 0,
        receitaPeriodo: receitaVal,
        receitaVariacao: pct(receitaVal, receitaPrevVal),
        receitaPrevPeriodo: receitaPrevVal,
        ticketMedio: activeMatriculas > 0 ? receitaVal / activeMatriculas : 0,
      },
      chartData,
      planos: planosCounts.map(p => ({ plano: p.plano, total: p._count.id })),
      topSchools,
    });
  } catch (error) {
    console.error("Erro ao buscar métricas admin:", error);
    return NextResponse.json({ error: "Erro ao buscar métricas." }, { status: 500 });
  }
}
