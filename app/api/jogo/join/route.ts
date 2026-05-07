import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildSessionState } from "@/lib/jogo/build-session-state";
import { sanitizeJogoAvatarEmoji } from "@/lib/jogo/jogo-avatars";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const pin = String(body?.pin || "").trim();
  const nome = String(body?.nome || "").trim();
  const avatarEmoji = sanitizeJogoAvatarEmoji(body?.avatarEmoji);

  if (!pin || !nome) {
    return NextResponse.json({ error: "PIN e nome são obrigatórios." }, { status: 400 });
  }

  const sessao = await prisma.jogoSessao.findUnique({
    where: { pin },
    select: {
      id: true,
      schoolId: true,
      status: true,
      avaliacao: { select: { deletedAt: true } },
    },
  });
  if (!sessao) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });
  if (sessao.avaliacao.deletedAt) {
    return NextResponse.json({ error: "Esta sessão não está mais disponível." }, { status: 410 });
  }
  if (sessao.status === "FINISHED") {
    return NextResponse.json({ error: "Sessão já finalizada." }, { status: 400 });
  }

  const participante = await prisma.jogoParticipante.create({
    data: {
      schoolId: sessao.schoolId,
      sessaoId: sessao.id,
      nome,
      avatarEmoji,
    },
  });

  const state = await buildSessionState(sessao.id);
  return NextResponse.json({
    participantId: participante.id,
    sessao: state,
  });
}
