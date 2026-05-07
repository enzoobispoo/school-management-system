import { prisma } from "@/lib/prisma";

/** Panorama acadêmico operacional (não substitui boletim completo). */
export async function queryAcademicOverview(schoolId?: string | null) {
  const sid = schoolId?.trim();
  if (!sid) {
    return { error: "school_missing" };
  }

  const since = new Date();
  since.setDate(since.getDate() - 14);
  since.setHours(0, 0, 0, 0);

  const [
    turmasAtivas,
    disciplinasAtivas,
    avaliacoesRecentes,
    aulasSemPresenca,
    notasLancadasRecentes,
  ] = await Promise.all([
    prisma.turma.count({ where: { schoolId: sid, ativo: true } }),
    prisma.disciplina.count({ where: { schoolId: sid, ativo: true } }),
    prisma.avaliacao.count({
      where: {
        schoolId: sid,
        deletedAt: null,
        createdAt: { gte: since },
      },
    }),
    prisma.aulaRegistro.count({
      where: {
        schoolId: sid,
        dataAula: { gte: since },
        presencas: { none: {} },
      },
    }),
    prisma.notaAvaliacao.count({
      where: {
        schoolId: sid,
        createdAt: { gte: since },
      },
    }),
  ]);

  return {
    turmasAtivas,
    disciplinasAtivas,
    avaliacoesCadastradasUltimos14d: avaliacoesRecentes,
    aulasSemPresencaLancadaUltimos14d: aulasSemPresenca,
    notasLancadasUltimos14d: notasLancadasRecentes,
    observacao:
      "Para detalhes de notas e frequência por aluno, use o módulo Acadêmico na interface ou pergunte turma/disciplina específica quando houver tools futuras.",
  };
}
