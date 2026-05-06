import { prisma } from "@/lib/prisma";
import { StatusMatricula } from "@prisma/client";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function autoSuspendOverdueEnrollments(schoolId: string) {
  const settings = await prisma.escolaSettings.findUnique({
    where: { schoolId },
    select: { suspenderAposInadimplenciaDias: true },
  });

  const suspendAfterDays =
    settings?.suspenderAposInadimplenciaDias &&
    settings.suspenderAposInadimplenciaDias > 0
      ? settings.suspenderAposInadimplenciaDias
      : 30;

  const today = startOfToday();
  const threshold = new Date(today);
  threshold.setDate(threshold.getDate() - suspendAfterDays);

  const overdueRows = await prisma.pagamento.findMany({
    where: {
      schoolId,
      status: { in: ["PENDENTE", "ATRASADO"] },
      dataPagamento: null,
      vencimento: { lte: threshold },
      matricula: { status: StatusMatricula.ATIVA },
    },
    select: {
      id: true,
      matriculaId: true,
    },
  });

  if (overdueRows.length === 0) {
    return { checked: 0, suspended: 0 };
  }

  const matriculaIds = [...new Set(overdueRows.map((r) => r.matriculaId))];

  const res = await prisma.matricula.updateMany({
    where: {
      schoolId,
      id: { in: matriculaIds },
      status: StatusMatricula.ATIVA,
    },
    data: {
      status: StatusMatricula.TRANCADA,
      observacoes: `Suspensão automática por inadimplência (>${suspendAfterDays} dias).`,
    },
  });

  return {
    checked: matriculaIds.length,
    suspended: res.count,
    suspendAfterDays,
  };
}

