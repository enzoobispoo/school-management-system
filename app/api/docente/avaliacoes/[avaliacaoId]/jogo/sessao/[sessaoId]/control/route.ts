import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireProfessorContext } from "@/lib/docente/require-professor";
import { buildSessionState } from "@/lib/jogo/build-session-state";
import { computeQuestaoDeadline } from "@/lib/jogo/questao-deadline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ avaliacaoId: string; sessaoId: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const prof = await requireProfessorContext(user);
  if (prof instanceof NextResponse) return prof;
  const { schoolId, professorId } = prof;
  const { avaliacaoId, sessaoId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "");

  const sessao = await prisma.jogoSessao.findFirst({
    where: {
      id: sessaoId,
      schoolId,
      avaliacaoId,
      avaliacao: { professorId, deletedAt: null },
    },
    include: { avaliacao: { include: { questoes: true } } },
  });
  if (!sessao) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });

  if (action === "start") {
    await prisma.jogoSessao.update({
      where: { id: sessao.id },
      data: {
        status: "RUNNING",
        startedAt: new Date(),
        questaoAtualOrdem: 1,
        questaoDeadlineAt: computeQuestaoDeadline(sessao.tempoPorQuestaoSegundos),
      },
    });
  } else if (action === "next") {
    const total = sessao.avaliacao.questoes.length;
    const nextOrdem = sessao.questaoAtualOrdem + 1;
    await prisma.jogoSessao.update({
      where: { id: sessao.id },
      data:
        nextOrdem > total ?
          {
            status: "FINISHED",
            finishedAt: new Date(),
            questaoDeadlineAt: null,
          }
        : {
            questaoAtualOrdem: nextOrdem,
            questaoDeadlineAt: computeQuestaoDeadline(sessao.tempoPorQuestaoSegundos),
          },
    });
  } else if (action === "finish") {
    await prisma.jogoSessao.update({
      where: { id: sessao.id },
      data: { status: "FINISHED", finishedAt: new Date(), questaoDeadlineAt: null },
    });
  } else {
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }

  const state = await buildSessionState(sessao.id);
  return NextResponse.json({ sessao: state });
}
