import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { guardProfessorTitularTurma } from "@/lib/docente/guard-professor-turma";
import { requireProfessorContext } from "@/lib/docente/require-professor";
import { createEmptySlideDeck } from "@/lib/docente/slide-deck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const ctx = await requireProfessorContext(user);
    if (ctx instanceof NextResponse) return ctx;
    const { schoolId, professorId } = ctx;

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const titulo = String(body.titulo ?? "").trim() || "Nova apresentação";
    const descricao = body.descricao ? String(body.descricao).trim() : null;
    const turmaId = body.turmaId ? String(body.turmaId).trim() : null;
    const disciplinaId = body.disciplinaId ? String(body.disciplinaId).trim() : null;

    if (turmaId) {
      const denied = await guardProfessorTitularTurma(user, schoolId, turmaId);
      if (denied) return denied;
    }

    if (disciplinaId && turmaId) {
      const link = await prisma.turmaDisciplina.findFirst({
        where: { schoolId, turmaId, disciplinaId },
        select: { id: true },
      });
      if (!link) {
        return NextResponse.json(
          { error: "Disciplina não pertence a esta turma." },
          { status: 400 }
        );
      }
    } else if (disciplinaId && !turmaId) {
      const d = await prisma.disciplina.findFirst({
        where: { id: disciplinaId, schoolId },
        select: { id: true },
      });
      if (!d) {
        return NextResponse.json({ error: "Disciplina inválida." }, { status: 400 });
      }
    }

    const deck = createEmptySlideDeck();

    const row = await prisma.materialDidatico.create({
      data: {
        schoolId,
        professorId,
        turmaId: turmaId || null,
        disciplinaId: disciplinaId || null,
        tipo: "SLIDE",
        titulo,
        descricao,
        arquivoUrl: null,
        arquivoNome: null,
        mimeType: null,
        tamanhoBytes: null,
        slideDeckJson: deck as object,
      },
      include: {
        turma: { select: { id: true, nome: true } },
        disciplina: { select: { id: true, nome: true } },
      },
    });

    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("POST slide-deck:", e);
    return NextResponse.json({ error: "Erro ao criar apresentação." }, { status: 500 });
  }
}
