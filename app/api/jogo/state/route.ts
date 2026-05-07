import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildSessionState } from "@/lib/jogo/build-session-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const pin = req.nextUrl.searchParams.get("pin")?.trim() || "";
  const participantId = req.nextUrl.searchParams.get("participantId")?.trim() || "";
  if (!pin) return NextResponse.json({ error: "PIN obrigatório." }, { status: 400 });

  const sessao = await prisma.jogoSessao.findUnique({
    where: { pin },
    select: {
      id: true,
      avaliacao: { select: { deletedAt: true } },
    },
  });
  if (!sessao) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });
  if (sessao.avaliacao.deletedAt) {
    return NextResponse.json({ error: "Esta sessão não está mais disponível." }, { status: 410 });
  }

  const state = await buildSessionState(sessao.id);
  if (!state) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });

  const participante =
    participantId ?
      await prisma.jogoParticipante.findFirst({
        where: { id: participantId, sessaoId: sessao.id },
        include: { respostas: true },
      })
    : null;

  const questionForPlayer =
    state.questaoAtual ?
      {
        id: state.questaoAtual.id,
        ordem: state.questaoAtual.ordem,
        enunciado: state.questaoAtual.enunciado,
        pontos: state.questaoAtual.pontos,
        alternativas: state.questaoAtual.alternativas.map((a) => ({
          id: a.id,
          ordem: a.ordem,
          texto: a.texto,
        })),
      }
    : null;

  const jaRespondeu =
    participante && questionForPlayer ?
      participante.respostas.some((r) => r.questaoId === questionForPlayer.id)
    : false;

  return NextResponse.json({
    sessao: {
      ...state,
      questaoAtual: questionForPlayer,
    },
    participante:
      participante ?
        {
          id: participante.id,
          nome: participante.nome,
          score: Number(participante.score),
          jaRespondeu,
        }
      : null,
  });
}
