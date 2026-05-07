import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const participantId = String(body?.participantId || "").trim();
  const questaoId = String(body?.questaoId || "").trim();
  const alternativaId =
    body?.alternativaId != null ? String(body.alternativaId).trim() : "";
  if (!participantId || !questaoId) {
    return NextResponse.json(
      { error: "participantId e questaoId são obrigatórios." },
      { status: 400 }
    );
  }

  const participante = await prisma.jogoParticipante.findUnique({
    where: { id: participantId },
    include: { sessao: true },
  });
  if (!participante) return NextResponse.json({ error: "Participante inválido." }, { status: 404 });
  if (participante.sessao.status !== "RUNNING") {
    return NextResponse.json({ error: "Sessão não está em andamento." }, { status: 400 });
  }

  const deadline = participante.sessao.questaoDeadlineAt;
  const pastDeadline = deadline != null && new Date() > deadline;
  if (pastDeadline && alternativaId) {
    return NextResponse.json({ error: "Tempo esgotado para esta questão." }, { status: 400 });
  }
  if (!pastDeadline && !alternativaId) {
    return NextResponse.json({ error: "Escolha uma alternativa." }, { status: 400 });
  }

  const questao = await prisma.avaliacaoQuestao.findUnique({
    where: { id: questaoId },
    include: { alternativas: true },
  });
  if (!questao || questao.avaliacaoId !== participante.sessao.avaliacaoId) {
    return NextResponse.json({ error: "Questão inválida para esta sessão." }, { status: 400 });
  }
  if (questao.ordem !== participante.sessao.questaoAtualOrdem) {
    return NextResponse.json({ error: "Esta questão ainda não está liberada." }, { status: 400 });
  }

  const jaExiste = await prisma.jogoResposta.findUnique({
    where: {
      participanteId_questaoId: {
        participanteId: participantId,
        questaoId,
      },
    },
  });
  if (jaExiste) {
    return NextResponse.json({ error: "Questão já respondida por este participante." }, { status: 400 });
  }

  const alternativa =
    alternativaId ? (questao.alternativas.find((a) => a.id === alternativaId) ?? null) : null;
  if (alternativaId && !alternativa) {
    return NextResponse.json({ error: "Alternativa inválida." }, { status: 400 });
  }
  const correta = Boolean(alternativa?.correta);
  const pontos = correta ? Number(questao.pontos ?? 1) : 0;

  await prisma.$transaction(async (tx) => {
    await tx.jogoResposta.create({
      data: {
        schoolId: participante.schoolId,
        participanteId: participantId,
        questaoId,
        alternativaId: alternativa?.id ?? null,
        correta,
        pontos,
      },
    });
    if (pontos > 0) {
      await tx.jogoParticipante.update({
        where: { id: participantId },
        data: { score: { increment: pontos } },
      });
    }
  });

  return NextResponse.json({ ok: true, correta, pontos });
}
