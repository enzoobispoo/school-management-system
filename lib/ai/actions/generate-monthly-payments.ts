import { prisma } from "@/lib/prisma";
import { AiActionResult } from "@/lib/ai/types";
import { getFinanceSuggestions } from "@/lib/ai/suggestions";

function getNextCompetence(month: number, year: number) {
  if (month === 12) {
    return { month: 1, year: year + 1 };
  }

  return { month: month + 1, year };
}

function getDefaultDueDate(month: number, year: number) {
  return new Date(year, month - 1, 10, 12, 0, 0);
}

export async function generateMonthlyPayments(
  confirmed: boolean
): Promise<AiActionResult> {
  if (!confirmed) {
    return {
      message:
        'Confirma a geração das mensalidades da próxima competência? Se quiser continuar, responda exatamente: "confirmar geração de mensalidades".',
      suggestions: [
        {
          label: "Confirmar geração",
          prompt: "confirmar geração de mensalidades",
        },
      ],
      executed: false,
    };
  }

  const matriculasAtivas = await prisma.matricula.findMany({
    where: { status: "ATIVA" },
    include: {
      turma: {
        include: {
          curso: true,
        },
      },
      pagamentos: {
        orderBy: [
          { competenciaAno: "desc" },
          { competenciaMes: "desc" },
        ],
        take: 1,
      },
    },
  });

  let createdCount = 0;

  for (const matricula of matriculasAtivas) {
    const lastPayment = matricula.pagamentos[0];

    let competenciaMes: number;
    let competenciaAno: number;

    if (lastPayment) {
      const next = getNextCompetence(
        lastPayment.competenciaMes,
        lastPayment.competenciaAno
      );
      competenciaMes = next.month;
      competenciaAno = next.year;
    } else {
      const now = new Date();
      competenciaMes = now.getMonth() + 1;
      competenciaAno = now.getFullYear();
    }

    const existing = await prisma.pagamento.findFirst({
      where: {
        matriculaId: matricula.id,
        competenciaMes,
        competenciaAno,
      },
      select: { id: true },
    });

    if (existing) continue;

    await prisma.pagamento.create({
      data: {
        matriculaId: matricula.id,
        competenciaMes,
        competenciaAno,
        descricao: `Mensalidade - ${matricula.turma.curso.nome}`,
        valor: matricula.turma.curso.valorMensal,
        vencimento: getDefaultDueDate(competenciaMes, competenciaAno),
        status: "PENDENTE",
      },
    });

    createdCount += 1;
  }

  return {
    message:
      createdCount > 0
        ? `Mensalidades geradas com sucesso. Foram criadas ${createdCount} cobrança${
            createdCount === 1 ? "" : "s"
          } nova${createdCount === 1 ? "" : "s"}.`
        : "Nenhuma nova mensalidade precisou ser gerada. Todas as matrículas ativas já possuem cobrança da próxima competência.",
    suggestions: getFinanceSuggestions(),
    executed: true,
  };
}