import { prisma } from "@/lib/prisma";
import { AiActionResult } from "@/lib/ai/types";
import { getFinanceSuggestions } from "@/lib/ai/suggestions";

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("pt-BR");
}

export async function listOverduePayments(): Promise<AiActionResult> {
  const pagamentos = await prisma.pagamento.findMany({
    where: { status: "ATRASADO" },
    include: {
      matricula: {
        include: {
          aluno: true,
          turma: {
            include: {
              curso: true,
            },
          },
        },
      },
    },
    orderBy: { vencimento: "asc" },
    take: 10,
  });

  if (pagamentos.length === 0) {
    return {
      message: "Não há pagamentos atrasados no momento.",
      suggestions: getFinanceSuggestions(),
    };
  }

  const lista = pagamentos
    .map((pagamento) => {
      return [
        `• Aluno: ${pagamento.matricula.aluno.nome}`,
        `  Curso: ${pagamento.matricula.turma.curso.nome}`,
        `  Valor: ${formatCurrency(Number(pagamento.valor))}`,
        `  Vencimento: ${formatDate(pagamento.vencimento)}`,
      ].join("\n");
    })
    .join("\n\n");

  return {
    message: `Estes são alguns pagamentos atrasados:\n\n${lista}`,
    suggestions: getFinanceSuggestions(),
  };
}