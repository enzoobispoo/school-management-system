import { prisma } from "@/lib/prisma";

export type DocenteTurmaRow = {
  id: string;
  nome: string;
  curso: string;
  capacidade: number;
  matriculasAtivas: number;
  disciplinas: Array<{ id: string; nome: string }>;
};

export type QueryDocenteTurmasResult = {
  error?: string;
  message?: string;
  turmas: DocenteTurmaRow[];
};

export async function queryDocenteTurmas(
  args: { search?: string; limit?: number },
  schoolId?: string | null,
  professorId?: string | null
): Promise<QueryDocenteTurmasResult> {
  const sid = schoolId?.trim();
  const pid = professorId?.trim();
  const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 40);

  if (!sid || !pid) {
    return {
      error: "missing_scope",
      turmas: [],
      message: "Escola ou vínculo de professor não encontrado.",
    };
  }

  const search = args.search?.trim();

  const turmas = await prisma.turma.findMany({
    where: {
      schoolId: sid,
      professorId: pid,
      ativo: true,
      ...(search ?
        { nome: { contains: search, mode: "insensitive" } }
      : {}),
    },
    select: {
      id: true,
      nome: true,
      capacidadeMaxima: true,
      curso: { select: { nome: true } },
      disciplinas: {
        select: {
          disciplina: { select: { id: true, nome: true } },
        },
      },
      matriculas: {
        where: { status: "ATIVA" },
        select: { id: true },
      },
    },
    orderBy: { nome: "asc" },
    take: limit,
  });

  return {
    turmas: turmas.map((t) => ({
      id: t.id,
      nome: t.nome,
      curso: t.curso.nome,
      capacidade: t.capacidadeMaxima,
      matriculasAtivas: t.matriculas.length,
      disciplinas: t.disciplinas.map((d) => ({
        id: d.disciplina.id,
        nome: d.disciplina.nome,
      })),
    })),
  };
}
