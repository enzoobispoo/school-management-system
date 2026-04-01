import { prisma } from "@/lib/prisma";
import { AiActionResult } from "@/lib/ai/types";
import { getFinanceSuggestions } from "@/lib/ai/suggestions";

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getComputedPaymentStatus(pagamento: {
  status: string;
  vencimento: Date;
  dataPagamento: Date | null;
}) {
  if (pagamento.status === "CANCELADO") return "CANCELADO";
  if (pagamento.status === "PAGO" || pagamento.dataPagamento) return "PAGO";

  const hoje = new Date();
  const vencimento = new Date(pagamento.vencimento);

  hoje.setHours(0, 0, 0, 0);
  vencimento.setHours(0, 0, 0, 0);

  if (vencimento < hoje) return "ATRASADO";
  return "PENDENTE";
}

export async function getMonthlyFinancialSummary(): Promise<AiActionResult> {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const startOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfCurrentMonth = new Date(currentYear, currentMonth, 1);

  const [pagamentosRecebidosNoMes, pagamentosEmAberto] = await Promise.all([
    prisma.pagamento.findMany({
      where: {
        status: "PAGO",
        dataPagamento: {
          gte: startOfCurrentMonth,
          lt: endOfCurrentMonth,
        },
      },
      select: {
        valor: true,
      },
    }),
    prisma.pagamento.findMany({
      where: {
        status: {
          in: ["PENDENTE", "ATRASADO"],
        },
      },
      select: {
        valor: true,
        status: true,
        vencimento: true,
        dataPagamento: true,
      },
    }),
  ]);

  const recebidoNoMes = pagamentosRecebidosNoMes.reduce(
    (acc, item) => acc + Number(item.valor),
    0
  );

  const pagamentosPendentes = pagamentosEmAberto.filter(
    (pagamento) => getComputedPaymentStatus(pagamento) === "PENDENTE"
  );

  const pagamentosAtrasados = pagamentosEmAberto.filter(
    (pagamento) => getComputedPaymentStatus(pagamento) === "ATRASADO"
  );

  const totalPendentes = pagamentosPendentes.reduce(
    (acc, item) => acc + Number(item.valor),
    0
  );

  const totalAtrasados = pagamentosAtrasados.reduce(
    (acc, item) => acc + Number(item.valor),
    0
  );

  return {
    message: `Resumo financeiro do mês:\n\n• Recebido no mês: ${formatCurrency(
      recebidoNoMes
    )}\n• Total pendente: ${formatCurrency(
      totalPendentes
    )}\n• Total atrasado: ${formatCurrency(
      totalAtrasados
    )}\n• Quantidade de pendências: ${
      pagamentosPendentes.length
    }\n• Quantidade de atrasos: ${pagamentosAtrasados.length}`,
    suggestions: getFinanceSuggestions(),
  };
}