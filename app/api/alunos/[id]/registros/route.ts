import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const schoolResult = requireSchool(user);
    if (schoolResult instanceof NextResponse) return schoolResult;
    const { schoolId } = schoolResult;
    const { id: alunoId } = await context.params;

    const rows = await prisma.alunoRegistro.findMany({
      where: { schoolId, alunoId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erro ao buscar registros do aluno:", error);
    return NextResponse.json({ error: "Erro ao buscar registros." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const schoolResult = requireSchool(user);
    if (schoolResult instanceof NextResponse) return schoolResult;
    const { schoolId } = schoolResult;
    const { id: alunoId } = await context.params;
    const body = await request.json();

    const tipoRaw = String(body?.tipo || "").toUpperCase();
    const tipo =
      tipoRaw === "OCORRENCIA" || tipoRaw === "ADVERTENCIA" || tipoRaw === "OBSERVACAO"
        ? tipoRaw
        : null;
    const titulo = String(body?.titulo || "").trim();
    const descricao = body?.descricao ? String(body.descricao).trim() : null;
    const gravidade = body?.gravidade ? String(body.gravidade).trim() : null;

    if (!tipo || !titulo) {
      return NextResponse.json(
        { error: "tipo e titulo são obrigatórios." },
        { status: 400 }
      );
    }

    const aluno = await prisma.aluno.findFirst({
      where: { id: alunoId, schoolId },
      select: { id: true },
    });
    if (!aluno) {
      return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });
    }

    const created = await prisma.alunoRegistro.create({
      data: { schoolId, alunoId, tipo, titulo, descricao, gravidade },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar registro do aluno:", error);
    return NextResponse.json({ error: "Erro ao criar registro." }, { status: 500 });
  }
}

