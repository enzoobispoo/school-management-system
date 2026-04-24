import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: turmaId } = await params;
    const body = await request.json();

    const {
      novoProfessorId,
      professorAnteriorId,
      dataInicio,
      motivoTroca,
      observacoes,
    } = body;

    if (!novoProfessorId) {
      return NextResponse.json(
        { error: "Novo professor é obrigatório." },
        { status: 400 }
      );
    }

    if (!dataInicio) {
      return NextResponse.json(
        { error: "Data de início é obrigatória." },
        { status: 400 }
      );
    }

    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      include: {
        professor: true,
      },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma não encontrada." },
        { status: 404 }
      );
    }

    if (turma.professorId === novoProfessorId) {
      return NextResponse.json(
        { error: "O novo professor deve ser diferente do atual." },
        { status: 400 }
      );
    }

    const novoProfessor = await prisma.professor.findUnique({
      where: { id: novoProfessorId },
    });

    if (!novoProfessor) {
      return NextResponse.json(
        { error: "Novo professor não encontrado." },
        { status: 404 }
      );
    }

    const inicio = new Date(dataInicio);

    await prisma.$transaction(async (tx) => {
      if (professorAnteriorId) {
        await tx.turmaProfessorHistorico.updateMany({
          where: {
            turmaId,
            professorId: professorAnteriorId,
            dataFim: null,
          },
          data: {
            dataFim: inicio,
          },
        });
      }

      await tx.turmaProfessorHistorico.create({
        data: {
          turmaId,
          professorId: novoProfessorId,
          dataInicio: inicio,
          motivoTroca: motivoTroca || null,
          observacoes: observacoes || null,
        },
      });

      await tx.turma.update({
        where: { id: turmaId },
        data: {
          professorId: novoProfessorId,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Professor alterado com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao trocar professor da turma:", error);

    return NextResponse.json(
      { error: "Erro interno ao trocar professor." },
      { status: 500 }
    );
  }
}