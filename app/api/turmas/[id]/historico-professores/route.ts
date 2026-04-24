import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id: turmaId } = await params;

    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      select: { id: true, nome: true },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma não encontrada." },
        { status: 404 }
      );
    }

    const historico = await prisma.turmaProfessorHistorico.findMany({
      where: { turmaId },
      include: {
        professor: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
      },
      orderBy: [
        { dataInicio: "desc" },
        { createdAt: "desc" as const },
      ],
    });

    return NextResponse.json({
      data: historico.map((item) => ({
        id: item.id,
        dataInicio: item.dataInicio,
        dataFim: item.dataFim,
        motivoTroca: item.motivoTroca,
        observacoes: item.observacoes,
        professor: {
          id: item.professor.id,
          nome: item.professor.nome,
          email: item.professor.email,
          telefone: item.professor.telefone,
        },
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar histórico de professores da turma:", error);

    return NextResponse.json(
      { error: "Erro ao buscar histórico de professores." },
      { status: 500 }
    );
  }
}