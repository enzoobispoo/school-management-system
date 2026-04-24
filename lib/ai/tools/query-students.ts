import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type QueryStudentsArgs = {
  search?: string;
  courseName?: string;
  paymentStatus?: "paid" | "pending" | "overdue";
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

export async function queryStudents(args: QueryStudentsArgs) {
  const limit = Math.min(Math.max(Number(args.limit || 10), 1), 50);

  const where: Prisma.AlunoWhereInput = {
    ...(args.search
      ? {
          OR: [
            { nome: { contains: args.search, mode: "insensitive" } },
            { email: { contains: args.search, mode: "insensitive" } },
            { telefone: { contains: args.search, mode: "insensitive" } },
            { cpf: { contains: args.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(args.courseName
      ? {
          matriculas: {
            some: {
              turma: {
                curso: {
                  nome: { contains: args.courseName, mode: "insensitive" },
                },
              },
            },
          },
        }
      : {}),
  };

  const alunos = await prisma.aluno.findMany({
    where,
    take: limit * 3,
    orderBy: { createdAt: "desc" },
    include: {
      matriculas: {
        include: {
          turma: {
            include: {
              curso: true,
            },
          },
          pagamentos: {
            take: 10,
            orderBy: { vencimento: "desc" },
          },
        },
      },
    },
  });

  const items = alunos
    .map((aluno) => {
      const paymentStatuses = aluno.matriculas.flatMap((matricula) =>
        matricula.pagamentos.map((pagamento) => getComputedPaymentStatus(pagamento))
      );

      let financialStatus: "paid" | "pending" | "overdue" = "paid";
      if (paymentStatuses.includes("ATRASADO")) {
        financialStatus = "overdue";
      } else if (paymentStatuses.includes("PENDENTE")) {
        financialStatus = "pending";
      }

      return {
        id: aluno.id,
        name: aluno.nome,
        email: aluno.email,
        phone: aluno.telefone,
        cpf: aluno.cpf,
        courses: aluno.matriculas.map((m) => m.turma.curso.nome),
        financialStatus,
      };
    })
    .filter((item) => {
      if (!args.paymentStatus) return true;
      return item.financialStatus === args.paymentStatus;
    })
    .slice(0, limit);

  return {
    total: items.length,
    items,
  };
}