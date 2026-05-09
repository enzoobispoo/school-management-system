import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { API_FORBIDDEN_PROFILE } from "@/lib/http/api-forbidden";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: API_FORBIDDEN_PROFILE }, { status: 403 });
  }

  const schoolId = request.nextUrl.searchParams.get("schoolId") ?? undefined;

  const subs = await prisma.schoolSubscription.findMany({
    where: schoolId ? { schoolId } : undefined,
    orderBy: { dataInicio: "desc" },
    include: {
      school: { select: { id: true, nome: true, slug: true } },
      plan: { select: { id: true, nome: true, preco: true } },
    },
  });

  return NextResponse.json(subs.map(s => ({
    ...s,
    valorPago: Number(s.valorPago),
    plan: { ...s.plan, preco: Number(s.plan.preco) },
  })));
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: API_FORBIDDEN_PROFILE }, { status: 403 });
  }

  const body = await request.json();
  const { schoolId, planId, valorPago, dataInicio, observacoes } = body;

  if (!schoolId || !planId) {
    return NextResponse.json({ error: "schoolId e planId são obrigatórios." }, { status: 400 });
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 });

  // Cancel previous active subscription for this school
  await prisma.schoolSubscription.updateMany({
    where: { schoolId, status: "ATIVA" },
    data: { status: "CANCELADA", dataFim: new Date() },
  });

  const sub = await prisma.$transaction(async (tx) => {
    const newSub = await tx.schoolSubscription.create({
      data: {
        schoolId,
        planId,
        valorPago: valorPago !== undefined ? Number(valorPago) : Number(plan.preco),
        dataInicio: dataInicio ? new Date(dataInicio) : new Date(),
        observacoes: observacoes?.trim() || null,
        status: "ATIVA",
      },
      include: {
        school: { select: { id: true, nome: true } },
        plan: { select: { id: true, nome: true, preco: true } },
      },
    });

    // Update school.plano field
    await tx.school.update({
      where: { id: schoolId },
      data: { plano: plan.slug },
    });

    return newSub;
  });

  return NextResponse.json({
    ...sub,
    valorPago: Number(sub.valorPago),
    plan: { ...sub.plan, preco: Number(sub.plan.preco) },
  }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: API_FORBIDDEN_PROFILE }, { status: 403 });
  }

  const body = await request.json();
  const { id, status, observacoes } = body;
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

  const sub = await prisma.schoolSubscription.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(observacoes !== undefined ? { observacoes } : {}),
      ...(status === "CANCELADA" ? { dataFim: new Date() } : {}),
    },
  });

  return NextResponse.json({ ...sub, valorPago: Number(sub.valorPago) });
}
