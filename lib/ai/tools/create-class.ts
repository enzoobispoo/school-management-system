import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createTurmaSchema } from "@/lib/validations/turma";
import {
  resolveCursoBySearchOrId,
  resolveProfessorBySearchOrId,
} from "@/lib/ai/tools/school-entity-resolve";

export async function createClassTool(
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

  const cursoRes = await resolveCursoBySearchOrId(sid, {
    cursoId: args.cursoId as string | undefined,
    cursoSearch: args.cursoSearch as string | undefined,
  });
  if (!cursoRes.ok) {
    if (cursoRes.error === "ambiguous") {
      return {
        ok: false,
        error: "ambiguous_curso",
        candidates: cursoRes.candidates,
        message: cursoRes.message,
      };
    }
    return {
      ok: false,
      error: cursoRes.error,
      message: cursoRes.message ?? "Não foi possível identificar o curso.",
    };
  }

  const cursoPick = cursoRes.unique!;

  const profRes = await resolveProfessorBySearchOrId(sid, {
    professorId: args.professorId as string | undefined,
    professorSearch: args.professorSearch as string | undefined,
  });
  if (!profRes.ok) {
    if (profRes.error === "ambiguous") {
      return {
        ok: false,
        error: "ambiguous_professor",
        candidates: profRes.candidates,
        message: profRes.message,
      };
    }
    return {
      ok: false,
      error: profRes.error,
      message: profRes.message ?? "Não foi possível identificar o professor.",
    };
  }

  const professorPick = profRes.unique!;

  const nomeTurma = String(args.nomeTurma ?? args.nome ?? "").trim();

  const turmaPayload = {
    cursoId: cursoPick.id,
    professorId: professorPick.id,
    nome: nomeTurma,
    capacidadeMaxima: args.capacidadeMaxima,
    ativo: args.ativo,
    horarios: args.horarios,
  };

  const parsed = createTurmaSchema.safeParse(turmaPayload);
  if (!parsed.success) {
    return {
      ok: false,
      error: "validation",
      details: parsed.error.flatten(),
      message:
        "Dados da turma inválidos. horarios precisa de ao menos um item com diaSemana (SEGUNDA, TERCA, ...), horaInicio e horaFim no formato HH:mm.",
    };
  }

  const [cursoRow, professorRow] = await Promise.all([
    prisma.curso.findUnique({
      where: { id: parsed.data.cursoId, schoolId: sid },
      select: { ativo: true, nome: true },
    }),
    prisma.professor.findUnique({
      where: { id: parsed.data.professorId, schoolId: sid },
      select: { ativo: true, nome: true },
    }),
  ]);

  if (!cursoRow?.ativo) {
    return { ok: false, error: "curso_inactive", message: "Curso inativo." };
  }
  if (!professorRow?.ativo) {
    return {
      ok: false,
      error: "professor_inactive",
      message: "Professor inativo — escolha outro.",
    };
  }

  const preview = {
    nomeTurma: parsed.data.nome,
    capacidadeMaxima: parsed.data.capacidadeMaxima,
    curso: cursoPick,
    professor: professorPick,
    horarios: parsed.data.horarios,
    ativo: parsed.data.ativo,
  };

  if (!confirmed) {
    return {
      ok: false,
      needsConfirmation: true,
      preview,
      instrucao:
        "Confirme curso, professor, capacidade e horários. Só execute com confirmed:true após o usuário aceitar.",
      suggestedPhrase: `confirmar criação da turma ${parsed.data.nome}`,
    };
  }

  try {
    const turma = await prisma.$transaction(async (tx) => {
      const novaTurma = await tx.turma.create({
        data: {
          schoolId: sid,
          cursoId: parsed.data.cursoId,
          professorId: parsed.data.professorId,
          nome: parsed.data.nome,
          capacidadeMaxima: parsed.data.capacidadeMaxima,
          ativo: parsed.data.ativo,
          horarios: { create: parsed.data.horarios },
        },
        include: { curso: true, professor: true, horarios: true },
      });

      await tx.turmaProfessorHistorico.create({
        data: {
          turmaId: novaTurma.id,
          professorId: parsed.data.professorId,
          dataInicio: new Date(),
          motivoTroca: "Professor inicial (EduIA)",
        },
      });

      await tx.notificacao.create({
        data: {
          schoolId: sid,
          tipo: "SISTEMA",
          titulo: "Nova turma criada",
          mensagem: `A turma ${novaTurma.nome} foi criada para o curso ${novaTurma.curso.nome} (via EduIA).`,
          entidadeTipo: "TURMA",
          entidadeId: novaTurma.id,
        },
      });

      return novaTurma;
    });

    return {
      ok: true,
      turmaId: turma.id,
      nome: turma.nome,
      cursoNome: turma.curso.nome,
      professorNome: turma.professor.nome,
      message: "Turma criada com sucesso.",
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        error: "duplicate",
        message: "Já existe uma turma com esse nome neste curso.",
      };
    }
    console.error("createClassTool:", error);
    return {
      ok: false,
      error: "create_failed",
      message: "Não foi possível criar a turma.",
    };
  }
}
