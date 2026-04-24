import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function hasTimeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
) {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);

  return aStart < bEnd && bStart < aEnd;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: turmaId } = await params;
    const body = await request.json();

    const {
      professorId: novoProfessorId,
      motivoTroca,
      observacoes,
      dataInicio,
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

    const inicio = new Date(dataInicio);

    if (Number.isNaN(inicio.getTime())) {
      return NextResponse.json(
        { error: "Data de início inválida." },
        { status: 400 }
      );
    }

    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      include: {
        horarios: true,
      },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma não encontrada." },
        { status: 404 }
      );
    }

    if (!turma.horarios.length) {
      return NextResponse.json(
        { error: "A turma não possui horários cadastrados." },
        { status: 400 }
      );
    }

    if (turma.professorId === novoProfessorId) {
      return NextResponse.json(
        { error: "Selecione um professor diferente do atual." },
        { status: 400 }
      );
    }

    const novoProfessor = await prisma.professor.findUnique({
      where: { id: novoProfessorId },
      select: {
        id: true,
        nome: true,
        ativo: true,
      },
    });

    if (!novoProfessor) {
      return NextResponse.json(
        { error: "Professor não encontrado." },
        { status: 404 }
      );
    }

    if (!novoProfessor.ativo) {
      return NextResponse.json(
        { error: "O professor selecionado está inativo." },
        { status: 400 }
      );
    }

    const outrasTurmasDoProfessor = await prisma.turma.findMany({
      where: {
        professorId: novoProfessorId,
        ativo: true,
        id: {
          not: turmaId,
        },
      },
      include: {
        curso: {
          select: {
            id: true,
            nome: true,
          },
        },
        horarios: true,
      },
    });

    for (const outraTurma of outrasTurmasDoProfessor) {
      for (const horarioAtual of turma.horarios) {
        for (const horarioOutraTurma of outraTurma.horarios) {
          const sameDay =
            horarioAtual.diaSemana === horarioOutraTurma.diaSemana;

          const overlap = hasTimeOverlap(
            horarioAtual.horaInicio,
            horarioAtual.horaFim,
            horarioOutraTurma.horaInicio,
            horarioOutraTurma.horaFim
          );

          if (sameDay && overlap) {
            return NextResponse.json(
              {
                error: `Conflito de horário: o professor já está vinculado à turma "${outraTurma.nome}" (${outraTurma.curso.nome}) em ${horarioOutraTurma.diaSemana}, ${horarioOutraTurma.horaInicio}-${horarioOutraTurma.horaFim}.`,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      if (turma.professorId) {
        await tx.turmaProfessorHistorico.updateMany({
          where: {
            turmaId,
            professorId: turma.professorId,
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
          dataFim: null,
          motivoTroca: motivoTroca || null,
          observacoes: observacoes || null,
          // criadoPor: session?.user?.id ?? null,
        },
      });

      await tx.turma.update({
        where: { id: turmaId },
        data: {
          professorId: novoProfessorId,
        },
      });

      await tx.notificacao.create({
        data: {
          tipo: "SISTEMA",
          titulo: "Professor alterado na turma",
          mensagem: `A turma ${turma.nome} agora está vinculada ao professor ${novoProfessor.nome}.`,
          entidadeTipo: "TURMA",
          entidadeId: turmaId,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Professor alterado com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao trocar professor:", error);

    return NextResponse.json(
      { error: "Erro interno ao trocar professor." },
      { status: 500 }
    );
  }
}