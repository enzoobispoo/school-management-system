import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { guardProfessorTitularTurma } from "@/lib/docente/guard-professor-turma";
import { requireProfessorContext } from "@/lib/docente/require-professor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ turmaId: string; avaliacaoId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const ctx = await requireProfessorContext(user);
    if (ctx instanceof NextResponse) return ctx;
    const { schoolId } = ctx;

    const { turmaId, avaliacaoId } = await context.params;
    const denied = await guardProfessorTitularTurma(user, schoolId, turmaId);
    if (denied) return denied;

    const body = await request.json();
    type NotaItem = { matriculaId?: string; nota?: number; observacao?: string };
    const notas: NotaItem[] = Array.isArray(body?.notas)
      ? (body.notas as NotaItem[])
      : [];

    if (notas.length === 0) {
      return NextResponse.json({ error: "Nenhuma nota informada." }, { status: 400 });
    }

    const avaliacao = await prisma.avaliacao.findFirst({
      where: { id: avaliacaoId, schoolId, turmaId, deletedAt: null },
      select: { id: true },
    });
    if (!avaliacao) {
      return NextResponse.json({ error: "Avaliação não encontrada." }, { status: 404 });
    }

    const ids: string[] = [
      ...new Set(
        notas
          .map((n) => String(n?.matriculaId || "").trim())
          .filter((id): id is string => id.length > 0)
      ),
    ];
    const valid = await prisma.matricula.findMany({
      where: { schoolId, turmaId, status: "ATIVA", id: { in: ids } },
      select: { id: true },
    });
    if (valid.length !== ids.length) {
      return NextResponse.json(
        { error: "Uma ou mais matrículas não pertencem a esta turma." },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      notas.map((item) =>
        prisma.notaAvaliacao.upsert({
          where: {
            avaliacaoId_matriculaId: {
              avaliacaoId,
              matriculaId: String(item.matriculaId),
            },
          },
          create: {
            schoolId,
            avaliacaoId,
            matriculaId: String(item.matriculaId),
            nota: Number(item.nota),
            observacao: item.observacao ? String(item.observacao) : null,
          },
          update: {
            nota: Number(item.nota),
            observacao: item.observacao ? String(item.observacao) : null,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST docente notas:", e);
    return NextResponse.json({ error: "Erro ao lançar notas." }, { status: 500 });
  }
}
