import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  TROCA_PRISMA_STALE_MESSAGE,
  trocaProfessorPropostaDelegate,
} from "@/lib/prisma/troca-professor-proposta";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { labelDiaSemana } from "@/lib/docente/dia-semana";
import { requireProfessorContext } from "@/lib/docente/require-professor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const ctx = requireProfessorContext(user);
    if (ctx instanceof NextResponse) return ctx;
    const { schoolId, professorId } = ctx;

    const trocaTx = trocaProfessorPropostaDelegate(prisma);
    if (!trocaTx) {
      return NextResponse.json({ error: TROCA_PRISMA_STALE_MESSAGE }, { status: 503 });
    }

    const rows = await trocaTx.findMany({
      where: {
        schoolId,
        professorAlvoId: professorId,
        status: "PENDENTE",
      },
      include: {
        professorAnterior: { select: { id: true, nome: true } },
        turma: {
          select: {
            id: true,
            nome: true,
            horarios: {
              select: {
                diaSemana: true,
                horaInicio: true,
                horaFim: true,
              },
            },
            curso: { select: { nome: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      dataInicioPrevista: r.dataInicioPrevista.toISOString(),
      motivoTroca: r.motivoTroca,
      observacoes: r.observacoes,
      resumoTurma: r.resumoTurma,
      resumoHorarios: r.resumoHorarios,
      turma: {
        id: r.turma.id,
        nome: r.turma.nome,
        cursoNome: r.turma.curso.nome,
        horarios: r.turma.horarios.map((h) => ({
          diaSemana: h.diaSemana,
          diaLabel: labelDiaSemana(h.diaSemana),
          horaInicio: h.horaInicio,
          horaFim: h.horaFim,
        })),
      },
      professorAnterior: r.professorAnterior,
    }));

    return NextResponse.json({ data });
  } catch (e) {
    console.error("GET docente/trocas-pendentes:", e);
    return NextResponse.json(
      { error: "Não foi possível carregar as solicitações." },
      { status: 500 }
    );
  }
}
