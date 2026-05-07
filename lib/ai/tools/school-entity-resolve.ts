import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function resolveCursoBySearchOrId(
  schoolId: string,
  opts: { cursoId?: string; cursoSearch?: string }
) {
  if (opts.cursoId?.trim()) {
    const c = await prisma.curso.findFirst({
      where: { schoolId, id: opts.cursoId.trim(), ativo: true },
      select: { id: true, nome: true, categoria: true },
    });
    if (!c) {
      return { ok: false, error: "curso_not_found", message: "Curso não encontrado ou inativo." };
    }
    return { ok: true, unique: c };
  }

  const search = opts.cursoSearch?.trim();
  if (!search) {
    return {
      ok: false,
      error: "curso_required",
      message: "Informe cursoId ou cursoSearch (nome parcial do curso ativo).",
    };
  }

  const rows = await prisma.curso.findMany({
    where: {
      schoolId,
      ativo: true,
      nome: { contains: search, mode: "insensitive" },
    },
    select: { id: true, nome: true, categoria: true },
    take: 12,
    orderBy: { nome: "asc" },
  });

  if (rows.length === 0) {
    return {
      ok: false,
      error: "no_match",
      message: `Nenhum curso ativo encontrado para "${search}".`,
    };
  }
  if (rows.length > 1) {
    return {
      ok: false,
      error: "ambiguous",
      message:
        "Vários cursos correspondem — peça ao usuário qual usar ou refine o nome / passe cursoId.",
      candidates: rows,
    };
  }
  return { ok: true, unique: rows[0]! };
}

export async function resolveProfessorBySearchOrId(
  schoolId: string,
  opts: { professorId?: string; professorSearch?: string }
) {
  if (opts.professorId?.trim()) {
    const p = await prisma.professor.findFirst({
      where: { schoolId, id: opts.professorId.trim(), ativo: true },
      select: { id: true, nome: true, email: true },
    });
    if (!p) {
      return {
        ok: false,
        error: "professor_not_found",
        message: "Professor não encontrado ou inativo.",
      };
    }
    return { ok: true, unique: p };
  }

  const search = opts.professorSearch?.trim();
  if (!search) {
    return {
      ok: false,
      error: "professor_required",
      message: "Informe professorId ou professorSearch (nome parcial).",
    };
  }

  const rows = await prisma.professor.findMany({
    where: {
      schoolId,
      ativo: true,
      nome: { contains: search, mode: "insensitive" },
    },
    select: { id: true, nome: true, email: true },
    take: 12,
    orderBy: { nome: "asc" },
  });

  if (rows.length === 0) {
    return {
      ok: false,
      error: "no_match",
      message: `Nenhum professor ativo encontrado para "${search}".`,
    };
  }
  if (rows.length > 1) {
    return {
      ok: false,
      error: "ambiguous",
      message:
        "Vários professores correspondem — refine o nome ou passe professorId.",
      candidates: rows,
    };
  }
  return { ok: true, unique: rows[0]! };
}

export async function resolveAlunoBySearchOrId(
  schoolId: string,
  opts: { alunoId?: string; studentSearch?: string }
) {
  if (opts.alunoId?.trim()) {
    const a = await prisma.aluno.findFirst({
      where: {
        schoolId,
        id: opts.alunoId.trim(),
        status: { not: "ARQUIVADO" },
      },
      select: { id: true, nome: true, email: true, status: true },
    });
    if (!a) {
      return { ok: false, error: "aluno_not_found", message: "Aluno não encontrado." };
    }
    return { ok: true, unique: a };
  }

  const search = opts.studentSearch?.trim();
  if (!search) {
    return {
      ok: false,
      error: "aluno_required",
      message: "Informe alunoId ou studentSearch (nome parcial do aluno).",
    };
  }

  const rows = await prisma.aluno.findMany({
    where: {
      schoolId,
      status: { not: "ARQUIVADO" },
      nome: { contains: search, mode: "insensitive" },
    },
    select: { id: true, nome: true, email: true, status: true },
    take: 15,
    orderBy: { nome: "asc" },
  });

  if (rows.length === 0) {
    return {
      ok: false,
      error: "no_match",
      message: `Nenhum aluno encontrado para "${search}".`,
    };
  }
  if (rows.length > 1) {
    return {
      ok: false,
      error: "ambiguous",
      message:
        "Vários alunos correspondem — refine o nome ou passe alunoId.",
      candidates: rows,
    };
  }
  return { ok: true, unique: rows[0]! };
}

type TurmaResolveRow = {
  id: string;
  nome: string;
  capacidadeMaxima: number;
  ativo: boolean;
  curso: { id: string; nome: string };
  professor: { id: string; nome: string };
  matriculas: { id: string }[];
};

export async function resolveTurmaBySearchOrId(
  schoolId: string,
  opts: {
    turmaId?: string;
    turmaSearch?: string;
    cursoId?: string;
    cursoSearch?: string;
  }
) {
  if (opts.turmaId?.trim()) {
    const t = await prisma.turma.findFirst({
      where: { schoolId, id: opts.turmaId.trim(), ativo: true },
      include: {
        curso: { select: { id: true, nome: true } },
        professor: { select: { id: true, nome: true } },
        matriculas: { where: { status: "ATIVA" }, select: { id: true } },
      },
    });
    if (!t) {
      return { ok: false, error: "turma_not_found", message: "Turma não encontrada ou inativa." };
    }
    return { ok: true, unique: t };
  }

  const search = opts.turmaSearch?.trim();
  if (!search) {
    return {
      ok: false,
      error: "turma_required",
      message: "Informe turmaId ou turmaSearch (nome parcial da turma).",
    };
  }

  const where: Prisma.TurmaWhereInput = {
    schoolId,
    ativo: true,
    nome: { contains: search, mode: "insensitive" },
  };

  if (opts.cursoId?.trim()) {
    where.cursoId = opts.cursoId.trim();
  } else if (opts.cursoSearch?.trim()) {
    where.curso = {
      nome: { contains: opts.cursoSearch.trim(), mode: "insensitive" },
      ativo: true,
    };
  }

  const rows = await prisma.turma.findMany({
    where,
    include: {
      curso: { select: { id: true, nome: true } },
      professor: { select: { id: true, nome: true } },
      matriculas: { where: { status: "ATIVA" }, select: { id: true } },
    },
    take: 15,
    orderBy: { nome: "asc" },
  });

  if (rows.length === 0) {
    return {
      ok: false,
      error: "no_match",
      message: `Nenhuma turma ativa encontrada para "${search}".`,
    };
  }
  if (rows.length > 1) {
    return {
      ok: false,
      error: "ambiguous",
      message:
        "Várias turmas correspondem — refine nome da turma ou passe turmaId (use cursoSearch para filtrar).",
      candidates: rows.map((r) => ({
        turmaId: r.id,
        turmaNome: r.nome,
        cursoNome: r.curso.nome,
        ocupacaoAtiva: r.matriculas.length,
        capacidadeMaxima: r.capacidadeMaxima,
      })),
    };
  }
  return { ok: true, unique: rows[0]! };
}
