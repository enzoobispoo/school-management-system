import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";

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

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const { id: turmaId } = await params;
    const disciplinaIdFilter = req.nextUrl.searchParams.get("disciplinaId")?.trim() || null;

    const turma = await prisma.turma.findFirst({
      where: { id: turmaId, schoolId },
      include: {
        horarios: true,
        curso: { select: { id: true, nome: true } },
        disciplinas: {
          include: {
            disciplina: { select: { id: true, nome: true, ativo: true } },
          },
        },
      },
    });

    if (!turma) {
      return NextResponse.json({ error: "Turma não encontrada." }, { status: 404 });
    }

    const disciplinasTurma = turma.disciplinas
      .filter((td) => td.disciplina.ativo)
      .map((td) => ({
        id: td.disciplina.id,
        nome: td.disciplina.nome,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    if (
      disciplinaIdFilter &&
      !disciplinasTurma.some((d) => d.id === disciplinaIdFilter)
    ) {
      return NextResponse.json(
        { error: "Disciplina não faz parte desta turma." },
        { status: 400 }
      );
    }

    const professores = await prisma.professor.findMany({
      where: { schoolId, ativo: true },
      include: {
        turmas: {
          where: { ativo: true },
          include: {
            horarios: true,
            curso: { select: { id: true, nome: true } },
            disciplinas: { select: { disciplinaId: true } },
          },
        },
      },
      orderBy: { nome: "asc" },
    });

    const professorIds = professores.map((p) => p.id);

    const ensinaDisciplinaSet = new Set<string>();
    if (disciplinaIdFilter && professorIds.length) {
      const [avRows, turmaRows] = await Promise.all([
        prisma.avaliacao.groupBy({
          by: ["professorId"],
          where: {
            schoolId,
            disciplinaId: disciplinaIdFilter,
            professorId: { in: professorIds },
            deletedAt: null,
          },
        }),
        prisma.turma.findMany({
          where: {
            schoolId,
            professorId: { in: professorIds },
            ativo: true,
            disciplinas: { some: { disciplinaId: disciplinaIdFilter } },
          },
          select: { professorId: true },
        }),
      ]);
      for (const r of avRows) {
        if (r.professorId != null) ensinaDisciplinaSet.add(r.professorId);
      }
      for (const r of turmaRows) {
        if (r.professorId) ensinaDisciplinaSet.add(r.professorId);
      }
    }

    const cursoTurmaId = turma.cursoId;

    const rows = professores.map((professor) => {
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
              conflitoDescricao = `${t.nome} (${t.curso.nome}) · ${h2.diaSemana} ${h2.horaInicio}–${h2.horaFim}`;
            }
          }
        }
      }

      const ensinaMesmoCurso = professor.turmas.some((t) => t.cursoId === cursoTurmaId);

      const ensinaDisciplinaSelecionada =
        disciplinaIdFilter ? ensinaDisciplinaSet.has(professor.id) : undefined;

      return {
        id: professor.id,
        nome: professor.nome,
        disponivel: !conflito,
        conflitoDescricao: conflito ? conflitoDescricao : undefined,
        ensinaMesmoCurso,
        ensinaDisciplinaSelecionada,
      };
    });

    rows.sort((a, b) => {
      if (a.disponivel !== b.disponivel) return a.disponivel ? -1 : 1;
      if (disciplinaIdFilter) {
        const ae = a.ensinaDisciplinaSelecionada ? 1 : 0;
        const be = b.ensinaDisciplinaSelecionada ? 1 : 0;
        if (ae !== be) return be - ae;
      }
      if (a.ensinaMesmoCurso !== b.ensinaMesmoCurso) return a.ensinaMesmoCurso ? -1 : 1;
      return a.nome.localeCompare(b.nome, "pt-BR");
    });

    return NextResponse.json({ disciplinasTurma, data: rows });
  } catch (e) {
    console.error("GET professores-disponiveis:", e);
    return NextResponse.json({ error: "Erro ao listar professores." }, { status: 500 });
  }
}
