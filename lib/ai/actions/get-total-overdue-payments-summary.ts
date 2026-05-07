import { prisma } from "@/lib/prisma";
import type { AiActionResult } from "@/lib/ai/types";
import { getFinanceSuggestions } from "@/lib/ai/suggestions";

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export async function getTotalOverduePaymentsSummary(
  schoolId?: string | null
): Promise<AiActionResult> {
  const sid = schoolId?.trim();
  if (!sid) {
    return {
      message:
        "Não foi possível identificar a escola. Faça login com um usuário vinculado a uma escola.",
      suggestions: getFinanceSuggestions(),
    };
  }

  const agg = await prisma.pagamento.aggregate({
    where: { schoolId: sid, status: "ATRASADO" },
    _count: { id: true },
    _sum: { valor: true },
  });

  const count = agg._count.id;
  const total = agg._sum.valor ? Number(agg._sum.valor) : 0;

  return {
    message: `Há ${count} pagamento${count === 1 ? "" : "s"} com status ATRASADO, totalizando ${formatCurrency(total)}.`,
    suggestions: getFinanceSuggestions(),
    executed: true,
  };
}
