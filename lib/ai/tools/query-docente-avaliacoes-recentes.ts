import { prisma } from "@/lib/prisma";

export async function queryDocenteAvaliacoesRecentes(
  args: { limit?: number; searchTitulo?: string },
  schoolId?: string | null,
  professorId?: string | null
) {
  const sid = schoolId?.trim();
  const pid = professorId?.trim();
  if (!sid || !pid) {
    return {
      error: "missing_scope",
      avaliacoes: [] as const,
      message: "Escola ou professor não identificado.",
    };
  }

  const limit = Math.min(Math.max(Number(args.limit) || 12, 1), 30);
  const q = args.searchTitulo?.trim();

  const rows = await prisma.avaliacao.findMany({
    where: {
      schoolId: sid,
      professorId: pid,
      deletedAt: null,
      ...(q ? { titulo: { contains: q, mode: "insensitive" as const } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      titulo: true,
      formato: true,
      dataAvaliacao: true,
      createdAt: true,
      turma: { select: { id: true, nome: true } },
      disciplina: { select: { id: true, nome: true } },
      _count: { select: { questoes: true, notas: true } },
    },
  });

  return {
    avaliacoes: rows.map((a) => ({
      id: a.id,
      titulo: a.titulo,
      formato: a.formato,
      dataAvaliacao: a.dataAvaliacao.toISOString(),
      criadaEm: a.createdAt.toISOString(),
      turma: a.turma,
      disciplina: a.disciplina,
      questoesCount: a._count.questoes,
      notasLancadas: a._count.notas,
    })),
  };
}
