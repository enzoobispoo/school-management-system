import { prisma } from "@/lib/prisma";
import { AiActionResult } from "@/lib/ai/types";
import { getFinanceSuggestions } from "@/lib/ai/suggestions";

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export async function getMonthlyRevenue(): Promise<AiActionResult> {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(
    hoje.getFullYear(),
    hoje.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  const receitaRecebidaNoMes = await prisma.pagamento.aggregate({
    _sum: { valor: true },
    where: {
      status: "PAGO",
      dataPagamento: {
        gte: inicioMes,
        lte: fimMes,
      },
    },
  });

  const total = Number(receitaRecebidaNoMes._sum.valor ?? 0);

  return {
    message: `O valor recebido neste mês foi de ${formatCurrency(total)}.`,
    suggestions: getFinanceSuggestions(),
  };
}