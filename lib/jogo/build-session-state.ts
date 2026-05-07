import { prisma } from "@/lib/prisma";

export async function buildSessionState(sessionId: string) {
  const sessao = await prisma.jogoSessao.findUnique({
    where: { id: sessionId },
    include: {
      avaliacao: {
        include: {
          questoes: {
            include: { alternativas: { orderBy: { ordem: "asc" } } },
            orderBy: { ordem: "asc" },
          },
        },
      },
      participants: {
        orderBy: [{ score: "desc" }, { createdAt: "asc" }],
        include: {
          respostas: true,
        },
      },
    },
  });

  if (!sessao) return null;

  const questaoAtual =
    sessao.avaliacao.questoes.find((q) => q.ordem === sessao.questaoAtualOrdem) ?? null;

  return {
    id: sessao.id,
    pin: sessao.pin,
    status: sessao.status,
    tempoPorQuestaoSegundos: sessao.tempoPorQuestaoSegundos ?? null,
    questaoDeadlineAt: sessao.questaoDeadlineAt
      ? sessao.questaoDeadlineAt.toISOString()
      : null,
    avaliacao: {
      id: sessao.avaliacao.id,
      titulo: sessao.avaliacao.titulo,
      formato: sessao.avaliacao.formato,
      totalQuestoes: sessao.avaliacao.questoes.length,
    },
    questaoAtualOrdem: sessao.questaoAtualOrdem,
    questaoAtual:
      questaoAtual ?
        {
          id: questaoAtual.id,
          ordem: questaoAtual.ordem,
          enunciado: questaoAtual.enunciado,
          explicacao: questaoAtual.explicacao,
          pontos: questaoAtual.pontos ? Number(questaoAtual.pontos) : 1,
          alternativas: questaoAtual.alternativas.map((a) => ({
            id: a.id,
            ordem: a.ordem,
            texto: a.texto,
            correta: a.correta,
          })),
        }
      : null,
    ranking: sessao.participants.map((p, idx) => ({
      posicao: idx + 1,
      id: p.id,
      nome: p.nome,
      avatarEmoji: p.avatarEmoji,
      score: Number(p.score),
      respostasCount: p.respostas.length,
    })),
  };
}
