import { prisma } from "@/lib/prisma";

export async function avaliacaoPodeSerEditada(avaliacaoId: string): Promise<{
  podeEditar: boolean;
  motivoBloqueio: string | null;
}> {
  const [notas, participantesJogo] = await Promise.all([
    prisma.notaAvaliacao.count({ where: { avaliacaoId } }),
    prisma.jogoParticipante.count({
      where: { sessao: { avaliacaoId } },
    }),
  ]);

  if (notas > 0) {
    return {
      podeEditar: false,
      motivoBloqueio: "Não é possível editar: já há notas lançadas para esta avaliação.",
    };
  }
  if (participantesJogo > 0) {
    return {
      podeEditar: false,
      motivoBloqueio:
        "Não é possível editar: esta prova já teve participação no modo jogo.",
    };
  }
  return { podeEditar: true, motivoBloqueio: null };
}
