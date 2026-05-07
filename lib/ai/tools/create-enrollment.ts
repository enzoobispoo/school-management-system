import { Prisma, StatusMatricula } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createMatriculaSchema } from "@/lib/validations/matricula";
import { createMatriculaWithInitialPayments } from "@/lib/matricula/bootstrap-enrollment";
import {
  resolveAlunoBySearchOrId,
  resolveTurmaBySearchOrId,
} from "@/lib/ai/tools/school-entity-resolve";

export async function createEnrollmentTool(
  args: Record<string, unknown>,
  schoolId?: string | null
) {
  const sid = schoolId?.trim();
  if (!sid) {
    return {
      ok: false,
      error: "missing_school",
      message: "Escola não identificada na sessão.",
    };
  }

  const confirmed = Boolean(args.confirmed);

  const alunoRes = await resolveAlunoBySearchOrId(sid, {
    alunoId: args.alunoId as string | undefined,
    studentSearch: args.studentSearch as string | undefined,
  });
  if (!alunoRes.ok) {
    if (alunoRes.error === "ambiguous") {
      return {
        ok: false,
        error: "ambiguous_aluno",
        candidates: alunoRes.candidates,
        message: alunoRes.message,
      };
    }
    return {
      ok: false,
      error: alunoRes.error,
      message: alunoRes.message ?? "Não foi possível identificar o aluno.",
    };
  }

  const alunoPick = alunoRes.unique!;

  const turmaRes = await resolveTurmaBySearchOrId(sid, {
    turmaId: args.turmaId as string | undefined,
    turmaSearch: args.turmaSearch as string | undefined,
    cursoId: args.cursoId as string | undefined,
    cursoSearch: args.cursoSearch as string | undefined,
  });
  if (!turmaRes.ok) {
    if (turmaRes.error === "ambiguous") {
      return {
        ok: false,
        error: "ambiguous_turma",
        candidates: turmaRes.candidates,
        message: turmaRes.message,
      };
    }
    return {
      ok: false,
      error: turmaRes.error,
      message: turmaRes.message ?? "Não foi possível identificar a turma.",
    };
  }

  const turmaPick = turmaRes.unique!;

  const turmaFull = await prisma.turma.findUnique({
    where: { id: turmaPick.id, schoolId: sid },
    include: {
      curso: true,
      professor: true,
      matriculas: { where: { status: "ATIVA" }, select: { id: true } },
    },
  });

  if (!turmaFull) {
    return { ok: false, error: "turma_missing", message: "Turma não encontrada." };
  }

  if (alunoPick.status === "INATIVO" || alunoPick.status === "ARQUIVADO") {
    return {
      ok: false,
      error: "aluno_inativo",
      message: "Aluno inativo ou arquivado não pode ser matriculado.",
    };
  }
  if (!turmaFull.ativo) {
    return { ok: false, error: "turma_inativa", message: "Turma inativa." };
  }
  if (!turmaFull.curso.ativo) {
    return { ok: false, error: "curso_inativo", message: "Curso inativo." };
  }
  if (!turmaFull.professor.ativo) {
    return {
      ok: false,
      error: "professor_inativo",
      message: "Turma com professor inativo.",
    };
  }
  if (turmaFull.matriculas.length >= turmaFull.capacidadeMaxima) {
    return {
      ok: false,
      error: "turma_lotada",
      message: "Turma sem vagas.",
    };
  }

  const duplicate = await prisma.matricula.findFirst({
    where: {
      schoolId: sid,
      alunoId: alunoPick.id,
      turmaId: turmaFull.id,
      status: "ATIVA",
    },
    select: { id: true },
  });
  if (duplicate) {
    return {
      ok: false,
      error: "already_enrolled",
      message: "Aluno já possui matrícula ATIVA nesta turma.",
    };
  }

  const matriculaParsed = createMatriculaSchema.safeParse({
    alunoId: alunoPick.id,
    turmaId: turmaFull.id,
    dataMatricula: args.dataMatricula,
    observacoes: args.observacoes,
    status: args.status ?? StatusMatricula.ATIVA,
    diaVencimentoMensal: args.diaVencimentoMensal,
  });

  if (!matriculaParsed.success) {
    return {
      ok: false,
      error: "validation",
      details: matriculaParsed.error.flatten(),
    };
  }

  const {
    alunoId,
    turmaId,
    dataMatricula,
    observacoes,
    status,
    diaVencimentoMensal,
  } = matriculaParsed.data;

  const dataBaseMatricula = dataMatricula ?? new Date();

  const preview = {
    aluno: alunoPick,
    turma: {
      id: turmaFull.id,
      nome: turmaFull.nome,
      curso: turmaFull.curso.nome,
      vagasUsadas: turmaFull.matriculas.length,
      capacidadeMaxima: turmaFull.capacidadeMaxima,
      valorMensal: Number(turmaFull.curso.valorMensal),
    },
    dataMatricula: dataBaseMatricula.toISOString(),
    observacoes: observacoes ?? null,
    status,
    aviso:
      "Serão geradas as primeiras mensalidades (parcelas iniciais) como na matrícula manual.",
  };

  if (!confirmed) {
    return {
      ok: false,
      needsConfirmation: true,
      preview,
      instrucao:
        "Explique que haverá criação de cobranças iniciais. Só confirme com confirmed:true após aceitação explícita.",
      suggestedPhrase: `confirmar matrícula do aluno ${alunoPick.nome} na turma ${turmaFull.nome}`,
    };
  }

  try {
    const escolaSettings = await prisma.escolaSettings.findUnique({
      where: { schoolId: sid },
      select: { diaVencimentoPadrao: true },
    });
    const fallbackDueDay = escolaSettings?.diaVencimentoPadrao ?? 10;

    const result = await prisma.$transaction((tx) =>
      createMatriculaWithInitialPayments(tx, {
        schoolId: sid,
        alunoId,
        turmaId,
        dataMatricula: dataBaseMatricula,
        observacoes,
        status,
        diaVencimentoMensal: diaVencimentoMensal ?? null,
        fallbackDueDay,
      })
    );

    return {
      ok: true,
      matriculaId: result.matricula.id,
      alunoNome: result.matricula.aluno.nome,
      turmaNome: result.matricula.turma.nome,
      parcelasGeradas: result.pagamentos.length,
      message: "Matrícula criada e cobranças iniciais geradas.",
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        error: "duplicate",
        message: "Matrícula duplicada — verifique se o aluno já está nesta turma.",
      };
    }
    console.error("createEnrollmentTool:", error);
    return {
      ok: false,
      error: "create_failed",
      message: "Não foi possível criar a matrícula.",
    };
  }
}
