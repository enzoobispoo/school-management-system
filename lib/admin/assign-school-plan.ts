import { prisma } from "@/lib/prisma";

/** Atribui plano à escola (assinatura ativa + `School.plano`). Igual ao fluxo de `/api/admin/subscriptions`. */
export async function assignSchoolPlan(
  schoolId: string,
  planId: string,
  opts?: { valorPago?: number; observacoes?: string | null }
) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.ativo) {
    const err = new Error("Plano não encontrado ou inativo.");
    (err as Error & { status?: number }).status = 404;
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    await tx.schoolSubscription.updateMany({
      where: { schoolId, status: { in: ["ATIVA", "TRIAL"] } },
      data: { status: "CANCELADA", dataFim: new Date() },
    });

    const isTestePlan = plan.slug.toLowerCase() === "teste";

    await tx.schoolSubscription.create({
      data: {
        schoolId,
        planId,
        valorPago: isTestePlan
          ? 0
          : (opts?.valorPago !== undefined ? Number(opts.valorPago) : Number(plan.preco)),
        dataInicio: new Date(),
        observacoes: opts?.observacoes?.trim() || null,
        status: isTestePlan ? "TRIAL" : "ATIVA",
      },
    });

    await tx.school.update({
      where: { id: schoolId },
      data: { plano: plan.slug },
    });
  });
}
