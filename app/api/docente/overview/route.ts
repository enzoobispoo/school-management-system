import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPrismaSchemaDriftError } from "@/lib/prisma/known-request";
import { trocaProfessorPropostaDelegate } from "@/lib/prisma/troca-professor-proposta";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import {
  jsWeekdayToDiaSemana,
  labelDiaSemana,
} from "@/lib/docente/dia-semana";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    if (user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    if (!user.schoolId) {
      return NextResponse.json(
        { error: "Escola não associada." },
        { status: 403 }
      );
    }

    const diaHoje = jsWeekdayToDiaSemana();

    if (!user.professorId) {
      return NextResponse.json({
        needsLink: true,
        professor: null,
        turmas: [],
        diaHoje,
        diaHojeLabel: labelDiaSemana(diaHoje),
        metricas: {
          turmasAtivas: 0,
          alunosTotal: 0,
          turmasComAulaHoje: 0,
        },
        trocasPendentes: 0,
      });
    }

    const professor = await prisma.professor.findFirst({
      where: {
        id: user.professorId,
        schoolId: user.schoolId,
        ativo: true,
      },
      select: { id: true, nome: true },
    });

    if (!professor) {
      return NextResponse.json({
        needsLink: true,
        professor: null,
        turmas: [],
        diaHoje,
        diaHojeLabel: labelDiaSemana(diaHoje),
        metricas: {
          turmasAtivas: 0,
          alunosTotal: 0,
          turmasComAulaHoje: 0,
        },
        trocasPendentes: 0,
      });
    }

    const turmasRaw = await prisma.turma.findMany({
      where: {
        schoolId: user.schoolId,
        professorId: professor.id,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        curso: { select: { nome: true } },
        horarios: {
          select: {
            diaSemana: true,
            horaInicio: true,
            horaFim: true,
          },
        },
      },
      orderBy: { nome: "asc" },
    });

    const turmaIds = turmasRaw.map((t) => t.id);

    const counts =
      turmaIds.length === 0
        ? []
        : await prisma.matricula.groupBy({
            by: ["turmaId"],
            where: {
              schoolId: user.schoolId,
              status: "ATIVA",
              turmaId: { in: turmaIds },
            },
            _count: { _all: true },
          });

    const countMap = new Map(
      counts.map((c) => [c.turmaId, c._count._all] as const)
    );

    const turmas = turmasRaw.map((t) => {
      const horariosHoje = t.horarios.filter((h) => h.diaSemana === diaHoje);
      return {
        id: t.id,
        nome: t.nome,
        cursoNome: t.curso.nome,
        alunosAtivos: countMap.get(t.id) ?? 0,
        horarios: t.horarios.map((h) => ({
          diaSemana: h.diaSemana,
          diaLabel: labelDiaSemana(h.diaSemana),
          horaInicio: h.horaInicio,
          horaFim: h.horaFim,
        })),
        horariosHoje: horariosHoje.map((h) => ({
          horaInicio: h.horaInicio,
          horaFim: h.horaFim,
        })),
      };
    });

    const alunosTotal = turmas.reduce((sum, t) => sum + t.alunosAtivos, 0);
    const turmasComAulaHoje = turmas.filter(
      (t) => t.horariosHoje.length > 0
    ).length;

    const trocaTx = trocaProfessorPropostaDelegate(prisma);
    let trocasPendentes = 0;
    if (trocaTx) {
      try {
        trocasPendentes = await trocaTx.count({
          where: {
            schoolId: user.schoolId,
            professorAlvoId: professor.id,
            status: "PENDENTE",
          },
        });
      } catch (e) {
        if (!isPrismaSchemaDriftError(e)) throw e;
      }
    }

    return NextResponse.json({
      needsLink: false,
      professor: { id: professor.id, nome: professor.nome },
      turmas,
      diaHoje,
      diaHojeLabel: labelDiaSemana(diaHoje),
      metricas: {
        turmasAtivas: turmas.length,
        alunosTotal,
        turmasComAulaHoje,
      },
      trocasPendentes,
    });
  } catch (error) {
    console.error("Erro em GET /api/docente/overview:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o painel." },
      { status: 500 }
    );
  }
}
