import type { Prisma, StatusMatricula } from "@prisma/client";
import {
  addCalendarMonths,
  buildDueDateClamped,
  calcularPrimeiroVencimentoMensal,
} from "@/lib/finance/due-date";

export const QUANTIDADE_MENSALIDADES_INICIAIS = 3;

type PagamentoCreated = Awaited<
  ReturnType<Prisma.TransactionClient["pagamento"]["create"]>
>;

/** Transação interna: cria matrícula, mensalidades iniciais e notificação (mesmo fluxo da API). */
export async function createMatriculaWithInitialPayments(
  tx: Prisma.TransactionClient,
  params: {
    schoolId: string;
    alunoId: string;
    turmaId: string;
    dataMatricula: Date;
    observacoes?: string | null;
    status: StatusMatricula;
    /** Opcional: dia fixo por matrícula; null/omitido usa só o padrão da escola nas próximas cobranças */
    diaVencimentoMensal?: number | null;
    fallbackDueDay: number;
  }
): Promise<{
  matricula: Prisma.MatriculaGetPayload<{
    include: {
      aluno: true;
      turma: { include: { curso: true; professor: true; horarios: true } };
    };
  }>;
  pagamentos: PagamentoCreated[];
}> {
  const {
    schoolId,
    alunoId,
    turmaId,
    dataMatricula,
    observacoes,
    status,
    diaVencimentoMensal,
    fallbackDueDay,
  } = params;

  const effectiveDueDay = diaVencimentoMensal ?? fallbackDueDay;

  const matricula = await tx.matricula.create({
    data: {
      schoolId,
      alunoId,
      turmaId,
      dataMatricula,
      observacoes,
      status,
      diaVencimentoMensal: diaVencimentoMensal ?? null,
    },
    include: {
      aluno: true,
      turma: {
        include: {
          curso: true,
          professor: true,
          horarios: true,
        },
      },
    },
  });

  const primeiro = calcularPrimeiroVencimentoMensal(dataMatricula, effectiveDueDay);
  let compYear = primeiro.getFullYear();
  let compMonth = primeiro.getMonth() + 1;

  const pagamentos: PagamentoCreated[] = [];
  for (let i = 0; i < QUANTIDADE_MENSALIDADES_INICIAIS; i++) {
    if (i > 0) {
      const next = addCalendarMonths(compYear, compMonth, 1);
      compYear = next.year;
      compMonth = next.month1based;
    }

    const vencimento = buildDueDateClamped(compYear, compMonth - 1, effectiveDueDay);

    pagamentos.push(
      await tx.pagamento.create({
        data: {
          schoolId,
          matriculaId: matricula.id,
          competenciaMes: compMonth,
          competenciaAno: compYear,
          descricao: `Mensalidade ${String(compMonth).padStart(2, "0")}/${compYear} - ${matricula.turma.curso.nome}`,
          valor: matricula.turma.curso.valorMensal,
          vencimento,
          status: "PENDENTE",
        },
      })
    );
  }

  await tx.notificacao.create({
    data: {
      schoolId,
      tipo: "NOVA_MATRICULA",
      titulo: "Nova matrícula realizada",
      mensagem: `${matricula.aluno.nome} foi matriculado na turma ${matricula.turma.nome} (${matricula.turma.curso.nome}).`,
      entidadeTipo: "MATRICULA",
      entidadeId: matricula.id,
    },
  });

  return { matricula, pagamentos };
}
