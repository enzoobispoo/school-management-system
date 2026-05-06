import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const schoolResult = requireSchool(user);
    if (schoolResult instanceof NextResponse) return schoolResult;
    const { schoolId } = schoolResult;

    const turmaId = new URL(request.url).searchParams.get("turmaId");

    let items: Array<{ id: string; nome: string; codigo: string | null }> = [];
    try {
      items = await prisma.disciplina.findMany({
        where: {
          schoolId,
          ...(turmaId ? { turmas: { some: { turmaId } } } : {}),
        },
        orderBy: { nome: "asc" },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2021" || error.code === "P2022")
      ) {
        // Fallback seguro enquanto a migração acadêmica não foi aplicada.
        return NextResponse.json([]);
      }
      throw error;
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error("Erro ao listar disciplinas:", error);
    return NextResponse.json({ error: "Erro ao listar disciplinas." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const schoolResult = requireSchool(user);
    if (schoolResult instanceof NextResponse) return schoolResult;
    const { schoolId } = schoolResult;

    const body = await request.json();
    const nome = String(body?.nome || "").trim();
    const codigo = body?.codigo ? String(body.codigo).trim() : null;
    const turmaIds = Array.isArray(body?.turmaIds) ? body.turmaIds.map(String) : [];

    if (!nome) {
      return NextResponse.json({ error: "Nome da disciplina é obrigatório." }, { status: 400 });
    }

    const created = await prisma.$transaction(async (tx) => {
      const disciplina = await tx.disciplina.create({
        data: { schoolId, nome, codigo },
      });

      if (turmaIds.length > 0) {
        const turmas = await tx.turma.findMany({
          where: { schoolId, id: { in: turmaIds } },
          select: { id: true },
        });
        if (turmas.length > 0) {
          await tx.turmaDisciplina.createMany({
            data: turmas.map((t) => ({
              schoolId,
              turmaId: t.id,
              disciplinaId: disciplina.id,
            })),
            skipDuplicates: true,
          });
        }
      }

      return disciplina;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar disciplina:", error);
    return NextResponse.json({ error: "Erro ao criar disciplina." }, { status: 500 });
  }
}

