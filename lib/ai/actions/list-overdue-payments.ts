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

export async function listOverduePayments(): Promise<
  AiActionResult & {
    conversationContext?: {
      scope: "overdue_payments";
      items: Array<{
        id: string;
        studentName: string;
        courseName: string;
        amount: number;
        dueDate: string;
      }>;
    };
  }
> {
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
    take: 20,
  });

  if (pagamentos.length === 0) {
    return {
      message: "Não há pagamentos atrasados no momento.",
      suggestions: getFinanceSuggestions(),
    };
  }

  const items = pagamentos.map((pagamento) => ({
    id: pagamento.id,
    studentName: pagamento.matricula.aluno.nome,
    courseName: pagamento.matricula.turma.curso.nome,
    amount: Number(pagamento.valor),
    dueDate: pagamento.vencimento.toISOString(),
  }));

  const lista = items
    .slice(0, 10)
    .map((item) =>
      [
        `• Aluno: ${item.studentName}`,
        `  Curso: ${item.courseName}`,
        `  Valor: ${formatCurrency(item.amount)}`,
        `  Vencimento: ${formatDate(item.dueDate)}`,
      ].join("\n")
    )
    .join("\n\n");

  return {
    message: `Estes são alguns pagamentos atrasados:\n\n${lista}`,
    suggestions: getFinanceSuggestions(),
    conversationContext: {
      scope: "overdue_payments",
      items,
    },
  };
}