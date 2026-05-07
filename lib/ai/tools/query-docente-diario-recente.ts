import { prisma } from "@/lib/prisma";

export async function queryDocenteDiarioRecente(
  args: { limit?: number },
  schoolId?: string | null,
  professorId?: string | null
) {
  const sid = schoolId?.trim();
  const pid = professorId?.trim();
  if (!sid || !pid) {
    return {
      error: "missing_scope",
      registros: [] as const,
      message: "Escola ou professor não identificado.",
    };
  }

  const limit = Math.min(Math.max(Number(args.limit) || 12, 1), 40);

  const turmas = await prisma.turma.findMany({
    where: { schoolId: sid, professorId: pid, ativo: true },
    select: { id: true },
  });
  const turmaIds = turmas.map((t) => t.id);
  if (turmaIds.length === 0) {
    return { registros: [], message: "Nenhuma turma titular encontrada." };
  }

  const registros = await prisma.aulaRegistro.findMany({
    where: { schoolId: sid, turmaId: { in: turmaIds } },
    orderBy: { dataAula: "desc" },
    take: limit,
    select: {
      id: true,
      dataAula: true,
      titulo: true,
      conteudo: true,
      turma: { select: { nome: true } },
      disciplina: { select: { nome: true } },
    },
  });

  return {
    registros: registros.map((r) => ({
      id: r.id,
      dataAula: r.dataAula.toISOString(),
      titulo: r.titulo,
      conteudo:
        r.conteudo && r.conteudo.length > 400 ?
          `${r.conteudo.slice(0, 400)}…`
        : r.conteudo,
      turma: r.turma.nome,
      disciplina: r.disciplina.nome,
    })),
  };
}
