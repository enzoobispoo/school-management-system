import { prisma } from "@/lib/prisma";
import type { AuthenticatedUser } from "@/lib/auth/get-current-user";

function str(v: unknown): string {
  return String(v ?? "").trim();
}

export async function createDocenteAvaliacaoTool(
  args: Record<string, unknown>,
  ctx: {
    schoolId?: string | null;
    user: AuthenticatedUser | null;
  }
) {
  const sid = ctx.schoolId?.trim();
  const user = ctx.user;

  if (!sid) {
    return {
      ok: false,
      error: "missing_school",
      message: "Escola não identificada na sessão.",
    };
  }

  if (!user || user.role !== "PROFESSOR" || !user.professorId) {
    return {
      ok: false,
      error: "forbidden",
      message: "Somente professores vinculados podem criar avaliações.",
    };
  }

  const confirmed = Boolean(args.confirmed);
  const turmaId = str(args.turmaId);
  const disciplinaId = str(args.disciplinaId);
  const titulo = str(args.titulo);
  const descricao =
    args.descricao === undefined || args.descricao === null ?
      null
    : str(args.descricao) || null;
  const peso =
    args.peso !== undefined && args.peso !== null ? Number(args.peso) : null;
  const dataRaw = str(args.dataAvaliacao);

  if (!turmaId || !disciplinaId || !titulo || !dataRaw) {
    return {
      ok: false,
      error: "validation",
      message:
        "Informe turmaId, disciplinaId, titulo e dataAvaliacao (ISO, ex.: 2026-05-15).",
    };
  }

  const dataAvaliacao = new Date(dataRaw);
  if (Number.isNaN(dataAvaliacao.getTime())) {
    return {
      ok: false,
      error: "validation",
      message: "dataAvaliacao inválida. Use uma data ISO completa.",
    };
  }

  const turma = await prisma.turma.findFirst({
    where: {
      id: turmaId,
      schoolId: sid,
      professorId: user.professorId,
      ativo: true,
    },
    select: {
      id: true,
      nome: true,
    },
  });

  if (!turma) {
    return {
      ok: false,
      error: "not_found",
      message: "Turma não encontrada ou você não é o professor titular.",
    };
  }

  const disciplinaNaTurma = await prisma.turmaDisciplina.findFirst({
    where: { schoolId: sid, turmaId, disciplinaId },
    include: { disciplina: { select: { nome: true } } },
  });

  if (!disciplinaNaTurma) {
    return {
      ok: false,
      error: "validation",
      message: "Disciplina não vinculada a esta turma.",
    };
  }

  const preview = {
    turmaId,
    turmaNome: turma.nome,
    disciplinaId,
    disciplinaNome: disciplinaNaTurma.disciplina.nome,
    titulo,
    descricao,
    peso: peso !== null && !Number.isNaN(peso) ? peso : null,
    dataAvaliacao: dataAvaliacao.toISOString(),
  };

  if (!confirmed) {
    return {
      ok: false,
      needsConfirmation: true,
      preview,
      instrucao:
        "Mostre o resumo ao professor. Só grave com confirmed:true depois de aceitação explícita.",
      suggestedPhrase: "confirmar criação da avaliação",
    };
  }

  const avaliacao = await prisma.avaliacao.create({
    data: {
      schoolId: sid,
      turmaId,
      disciplinaId,
      professorId: user.professorId,
      titulo,
      descricao,
      peso:
        preview.peso !== null && !Number.isNaN(Number(preview.peso)) ?
          preview.peso
        : null,
      dataAvaliacao,
    },
  });

  return {
    ok: true,
    avaliacaoId: avaliacao.id,
    titulo: avaliacao.titulo,
    dataAvaliacao: avaliacao.dataAvaliacao.toISOString(),
    message:
      "Avaliação criada. O professor pode lançar notas em /docente ou pelo fluxo de turmas.",
  };
}
