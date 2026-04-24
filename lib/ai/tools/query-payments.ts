import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type QueryPaymentsArgs = {
  search?: string;
  status?: "PAGO" | "PENDENTE" | "ATRASADO" | "CANCELADO";
  studentName?: string;
  courseName?: string;
  limit?: number;
};

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

export async function queryPayments(args: QueryPaymentsArgs) {
  const limit = Math.min(Math.max(Number(args.limit || 10), 1), 50);

  const where: Prisma.PagamentoWhereInput = {
    ...(args.studentName
      ? {
          matricula: {
            aluno: {
              nome: { contains: args.studentName, mode: "insensitive" },
            },
          },
        }
      : {}),
    ...(args.courseName
      ? {
          matricula: {
            turma: {
              curso: {
                nome: { contains: args.courseName, mode: "insensitive" },
              },
            },
          },
        }
      : {}),
    ...(args.search
      ? {
          OR: [
            { descricao: { contains: args.search, mode: "insensitive" } },
            {
              matricula: {
                aluno: {
                  nome: { contains: args.search, mode: "insensitive" },
                },
              },
            },
            {
              matricula: {
                turma: {
                  curso: {
                    nome: { contains: args.search, mode: "insensitive" },
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const pagamentos = await prisma.pagamento.findMany({
    where,
    take: limit * 3,
    orderBy: [{ vencimento: "asc" }, { createdAt: "desc" }],
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
  });

  const items = pagamentos
    .map((pagamento) => ({
      id: pagamento.id,
      description: pagamento.descricao,
      amount: Number(pagamento.valor),
      status: getComputedPaymentStatus(pagamento),
      dueDate: pagamento.vencimento.toISOString(),
      paidAt: pagamento.dataPagamento?.toISOString() ?? null,
      studentName: pagamento.matricula.aluno.nome,
      courseName: pagamento.matricula.turma.curso.nome,
      competenceMonth: pagamento.competenciaMes,
      competenceYear: pagamento.competenciaAno,
    }))
    .filter((item) => (args.status ? item.status === args.status : true))
    .slice(0, limit);

  return {
    total: items.length,
    items,
  };
}