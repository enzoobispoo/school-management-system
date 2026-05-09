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

export async function DELETE(_req: Request, context: RouteContext) {
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
      where: {
        id: avaliacaoId,
        schoolId,
        professorId,
        deletedAt: { not: null },
      },
      select: {
        turmaId: true,
        _count: { select: { notas: true } },
      },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Avaliação não encontrada na lixeira." },
        { status: 404 }
      );
    }

    const denied = await guardProfessorTitularTurma(user, schoolId, existing.turmaId);
    if (denied) return denied;

    if (existing._count.notas > 0) {
      return NextResponse.json(
        {
          error:
            "Não é possível apagar definitivamente: existem notas lançadas nesta prova.",
        },
        { status: 403 }
      );
    }

    await prisma.avaliacao.delete({ where: { id: avaliacaoId } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE avaliacao permanent:", e);
    return NextResponse.json({ error: "Erro ao excluir definitivamente." }, { status: 500 });
  }
}
