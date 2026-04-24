import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function hasOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const aS = timeToMinutes(aStart);
  const aE = timeToMinutes(aEnd);
  const bS = timeToMinutes(bStart);
  const bE = timeToMinutes(bEnd);

  return aS < bE && bS < aE;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id: turmaId } = await params;

  const turma = await prisma.turma.findUnique({
    where: { id: turmaId },
    include: { horarios: true },
  });

  if (!turma) {
    return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
  }

  const professores = await prisma.professor.findMany({
    where: { ativo: true },
    include: {
      turmas: {
        where: { ativo: true },
        include: { horarios: true, curso: true },
      },
    },
  });

  const result = professores.map((professor) => {
    let conflito = false;
    let conflitoDescricao = "";

    for (const t of professor.turmas) {
      for (const h1 of turma.horarios) {
        for (const h2 of t.horarios) {
          if (
            h1.diaSemana === h2.diaSemana &&
            hasOverlap(h1.horaInicio, h1.horaFim, h2.horaInicio, h2.horaFim)
          ) {
            conflito = true;
            conflitoDescricao = `${t.nome} (${t.curso.nome}) - ${h2.diaSemana} ${h2.horaInicio}-${h2.horaFim}`;
          }
        }
      }
    }

    return {
      id: professor.id,
      nome: professor.nome,
      disponivel: !conflito,
      conflitoDescricao,
    };
  });

  return NextResponse.json({ data: result });
}