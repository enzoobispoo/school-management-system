import { prisma } from "@/lib/prisma";
import { logFinanceAuditEvent } from "@/lib/services/finance-audit";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function enforceSubscriptionDelinquencyPolicy(schoolId: string) {
  const settings = await prisma.escolaSettings.findUnique({
    where: { schoolId },
    select: {
      subscriptionInadimplenciaAction: true,
      subscriptionInadimplenciaDias: true,
    },
  });

  const actionRaw = settings?.subscriptionInadimplenciaAction || "SUSPENDER";
  const action = actionRaw === "CANCELAR" ? "CANCELAR" : "SUSPENDER";
  const limitDays =
    settings?.subscriptionInadimplenciaDias &&
    settings.subscriptionInadimplenciaDias > 0
      ? settings.subscriptionInadimplenciaDias
      : 45;

  const threshold = startOfToday();
  threshold.setDate(threshold.getDate() - limitDays);

  const oldestOverdue = await prisma.pagamento.findFirst({
    where: {
      schoolId,
      status: { in: ["PENDENTE", "ATRASADO"] },
      dataPagamento: null,
      vencimento: { lte: threshold },
    },
    orderBy: { vencimento: "asc" },
    select: { id: true, vencimento: true },
  });

  if (!oldestOverdue) {
    return { affected: false, reason: "no-overdue-threshold" as const };
  }

  const activeSub = await prisma.schoolSubscription.findFirst({
    where: { schoolId, status: { in: ["ATIVA", "TRIAL"] } },
    orderBy: { dataInicio: "desc" },
    select: { id: true, status: true },
  });

  if (!activeSub) {
    return { affected: false, reason: "no-active-subscription" as const };
  }

  if (action === "SUSPENDER" && activeSub.status === "TRIAL") {
    return { affected: false, reason: "trial-ignored" as const };
  }

  const nextStatus = action === "CANCELAR" ? "CANCELADA" : "SUSPENSA";

  await prisma.schoolSubscription.update({
    where: { id: activeSub.id },
    data: {
      status: nextStatus,
      ...(nextStatus === "CANCELADA" ? { dataFim: new Date() } : {}),
      observacoes: `Ajuste automático por inadimplência (${limitDays}+ dias).`,
    },
  });

  await logFinanceAuditEvent({
    schoolId,
    eventType: "SUBSCRIPTION_DELINQUENCY_POLICY_APPLIED",
    source: "cron",
    status: "success",
    referenceId: activeSub.id,
    message: `Assinatura atualizada automaticamente para ${nextStatus}.`,
    payload: {
      action,
      limitDays,
      overduePagamentoId: oldestOverdue.id,
      overdueVencimento: oldestOverdue.vencimento,
    },
  });

  return { affected: true, subscriptionId: activeSub.id, nextStatus, action, limitDays };
}

