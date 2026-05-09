import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { guardProfessorTitularTurma } from "@/lib/docente/guard-professor-turma";
import { requireProfessorContext } from "@/lib/docente/require-professor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ avaliacaoId: string }>;
}

export async function POST(_req: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const ctx = await requireProfessorContext(user);
    if (ctx instanceof NextResponse) return ctx;
    const { schoolId, professorId } = ctx;

    const { avaliacaoId } = await context.params;

    const existing = await prisma.avaliacao.findFirst({
      where: { id: avaliacaoId, schoolId, professorId },
      select: { turmaId: true, deletedAt: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Avaliação não encontrada." }, { status: 404 });
    }

    const denied = await guardProfessorTitularTurma(user, schoolId, existing.turmaId);
    if (denied) return denied;

    if (!existing.deletedAt) {
      return NextResponse.json({ error: "Esta prova não está na lixeira." }, { status: 400 });
    }

    await prisma.avaliacao.update({
      where: { id: avaliacaoId },
      data: { deletedAt: null },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST restore avaliacao:", e);
    return NextResponse.json({ error: "Erro ao restaurar prova." }, { status: 500 });
  }
}
