import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireProfessorContext } from "@/lib/docente/require-professor";
import { parseSlideDeck } from "@/lib/docente/slide-deck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, ctx: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const ctxProf = await requireProfessorContext(user);
    if (ctxProf instanceof NextResponse) return ctxProf;
    const { schoolId, professorId } = ctxProf;

    const { id } = await ctx.params;

    const row = await prisma.materialDidatico.findFirst({
      where: { id, schoolId, professorId },
      include: {
        turma: { select: { id: true, nome: true } },
        disciplina: { select: { id: true, nome: true } },
      },
    });

    if (!row) {
      return NextResponse.json({ error: "Material não encontrado." }, { status: 404 });
    }

    return NextResponse.json(row);
  } catch (e) {
    console.error("GET materiais/[id]:", e);
    return NextResponse.json({ error: "Erro ao carregar material." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const ctxProf = await requireProfessorContext(user);
    if (ctxProf instanceof NextResponse) return ctxProf;
    const { schoolId, professorId } = ctxProf;

    const { id } = await ctx.params;

    const existing = await prisma.materialDidatico.findFirst({
      where: { id, schoolId, professorId },
      select: { id: true, slideDeckJson: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Material não encontrado." }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const data: {
      titulo?: string;
      descricao?: string | null;
      slideDeckJson?: object;
    } = {};

    if (typeof body.titulo === "string") {
      const t = body.titulo.trim();
      if (t.length >= 1 && t.length <= 200) data.titulo = t;
    }

    if (body.descricao === null || body.descricao === "") {
      data.descricao = null;
    } else if (typeof body.descricao === "string") {
      data.descricao = body.descricao.trim().slice(0, 2000) || null;
    }

    if (body.slideDeckJson !== undefined) {
      const parsed = parseSlideDeck(body.slideDeckJson);
      if (!parsed) {
        return NextResponse.json({ error: "Estrutura de slides inválida." }, { status: 400 });
      }
      data.slideDeckJson = parsed as object;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
    }

    const row = await prisma.materialDidatico.update({
      where: { id },
      data,
      include: {
        turma: { select: { id: true, nome: true } },
        disciplina: { select: { id: true, nome: true } },
      },
    });

    return NextResponse.json(row);
  } catch (e) {
    console.error("PATCH materiais/[id]:", e);
    return NextResponse.json({ error: "Erro ao salvar." }, { status: 500 });
  }
}
