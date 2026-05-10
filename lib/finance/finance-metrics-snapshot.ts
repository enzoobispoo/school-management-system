import "server-only";

import { prisma } from "@/lib/prisma";

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function computedStatus(p: {
  status: string;
  vencimento: Date;
  dataPagamento: Date | null;
}) {
  if (p.status === "CANCELADO") return "CANCELADO";
  if (p.status === "PAGO" || p.dataPagamento) return "PAGO";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(p.vencimento);
  due.setHours(0, 0, 0, 0);
  return due < now ? "ATRASADO" : "PENDENTE";
}

/** Snapshot serializável das métricas financeiras (mesmo contrato do GET /api/financeiro/metricas). */
export async function buildFinanceMetricsSnapshot(schoolId: string) {
  const [payments, envioStats, auditEvents] = await Promise.all([
    prisma.pagamento.findMany({
      where: { schoolId, status: { not: "CANCELADO" } },
      select: {
        id: true,
        valor: true,
        status: true,
        vencimento: true,
        dataPagamento: true,
        competenciaMes: true,
        competenciaAno: true,
        billingExternalId: true,
        billingStatus: true,
      },
    }),
    prisma.cobrancaEnvio.groupBy({
      by: ["status"],
      where: {
        pagamento: { schoolId },
        tipo: "COBRANCA_ATRASO",
      },
      _count: { status: true },
    }),
    prisma.financeAuditEvent.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        eventType: true,
        source: true,
        status: true,
        referenceId: true,
        message: true,
        createdAt: true,
      },
    }),
  ]);

  const start = startOfMonth();
  const end = endOfMonth();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  let receitaTotal = 0;
  let recebidoMes = 0;
  let valoresPendentes = 0;
  let valoresAtrasados = 0;
  let qtdPendentes = 0;
  let qtdAtrasados = 0;
  let reconciliadosViaWebhook = 0;

  for (const p of payments) {
    const value = Number(p.valor);
    const status = computedStatus(p);

    if (status === "PAGO") {
      receitaTotal += value;
      if (
        p.dataPagamento &&
        p.dataPagamento >= start &&
        p.dataPagamento < end &&
        p.competenciaMes === currentMonth &&
        p.competenciaAno === currentYear
      ) {
        recebidoMes += value;
      }
    } else if (status === "PENDENTE") {
      valoresPendentes += value;
      qtdPendentes += 1;
    } else if (status === "ATRASADO") {
      valoresAtrasados += value;
      qtdAtrasados += 1;
    }

    if (p.status === "PAGO" && p.billingExternalId && p.billingStatus) {
      reconciliadosViaWebhook += 1;
    }
  }

  const receitaPrevista = valoresPendentes + valoresAtrasados;
  const baseRecebimento = recebidoMes + valoresPendentes;
  const taxaRecebimento =
    baseRecebimento > 0 ? (recebidoMes / baseRecebimento) * 100 : 0;
  const baseInadimplencia = receitaTotal + receitaPrevista;
  const taxaInadimplencia =
    baseInadimplencia > 0 ? (valoresAtrasados / baseInadimplencia) * 100 : 0;

  const envioMap = new Map(
    envioStats.map((s) => [s.status, s._count.status ?? 0])
  );

  return {
    totals: {
      receitaTotal,
      recebidoMes,
      valoresPendentes,
      valoresAtrasados,
      quantidadePendentes: qtdPendentes,
      quantidadeAtrasados: qtdAtrasados,
    },
    advancedMetrics: {
      receitaPrevista,
      taxaRecebimento,
      taxaInadimplencia,
    },
    reconciliation: {
      pagamentosProcessados: payments.length,
      reconciliadosViaWebhook,
      taxaReconciliacaoWebhook:
        payments.length > 0 ? (reconciliadosViaWebhook / payments.length) * 100 : 0,
    },
    dunning: {
      enviados: envioMap.get("ENVIADO") ?? 0,
      falhos: envioMap.get("FALHO") ?? 0,
      pendentes: envioMap.get("PENDENTE") ?? 0,
    },
    auditTrail: auditEvents.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}
