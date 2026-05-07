import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireProfessorContext } from "@/lib/docente/require-professor";
import { buildSessionState } from "@/lib/jogo/build-session-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ avaliacaoId: string }>;
}

function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const prof = requireProfessorContext(user);
  if (prof instanceof NextResponse) return prof;
  const { schoolId, professorId } = prof;
  const { avaliacaoId } = await context.params;

  const avaliacao = await prisma.avaliacao.findFirst({
    where: { id: avaliacaoId, schoolId, professorId },
    select: { id: true, deletedAt: true },
  });
  if (!avaliacao) return NextResponse.json({ error: "Avaliação não encontrada." }, { status: 404 });
  if (avaliacao.deletedAt) {
    return NextResponse.json(
      { error: "Esta prova está na lixeira. Restaure-a para usar o modo jogo." },
      { status: 400 }
    );
  }

  const sessao = await prisma.jogoSessao.findFirst({
    where: { schoolId, avaliacaoId },
    orderBy: { createdAt: "desc" },
  });
  if (!sessao) return NextResponse.json({ sessao: null });
  const state = await buildSessionState(sessao.id);
  return NextResponse.json({ sessao: state });
}

function parseTempoPorQuestao(body: unknown): number | null {
  const raw =
    body && typeof body === "object" && "tempoPorQuestaoSegundos" in body ?
      (body as { tempoPorQuestaoSegundos?: unknown }).tempoPorQuestaoSegundos
    : undefined;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  const t = Math.floor(n);
  if (t <= 0) return null;
  return Math.min(Math.max(t, 5), 300);
}

export async function POST(req: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const prof = requireProfessorContext(user);
  if (prof instanceof NextResponse) return prof;
  const { schoolId, professorId } = prof;
  const { avaliacaoId } = await context.params;

  const avaliacao = await prisma.avaliacao.findFirst({
    where: { id: avaliacaoId, schoolId, professorId },
    include: { questoes: { include: { alternativas: true } } },
  });
  if (!avaliacao) return NextResponse.json({ error: "Avaliação não encontrada." }, { status: 404 });
  if (avaliacao.deletedAt) {
    return NextResponse.json(
      { error: "Esta prova está na lixeira. Restaure-a para usar o modo jogo." },
      { status: 400 }
    );
  }
  if (avaliacao.formato !== "JOGO") {
    return NextResponse.json({ error: "Avaliação não está no formato jogo." }, { status: 400 });
  }
  if (avaliacao.questoes.length === 0) {
    return NextResponse.json({ error: "Adicione questões para iniciar uma sessão." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const tempoPorQuestaoSegundos = parseTempoPorQuestao(body);

  let pin = generatePin();
  for (let i = 0; i < 5; i += 1) {
    const exists = await prisma.jogoSessao.findUnique({ where: { pin } });
    if (!exists) break;
    pin = generatePin();
  }

  const sessao = await prisma.jogoSessao.create({
    data: {
      schoolId,
      avaliacaoId,
      pin,
      status: "LOBBY",
      questaoAtualOrdem: 1,
      createdByProfessorId: professorId,
      tempoPorQuestaoSegundos,
    },
  });

  const state = await buildSessionState(sessao.id);
  return NextResponse.json({ sessao: state }, { status: 201 });
}
