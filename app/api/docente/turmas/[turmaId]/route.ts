import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";
import { guardProfessorTitularTurma } from "@/lib/docente/guard-professor-turma";
import { labelDiaSemana } from "@/lib/docente/dia-semana";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ turmaId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const schoolResult = requireSchool(user);
    if (schoolResult instanceof NextResponse) return schoolResult;
    const { schoolId } = schoolResult;

    const { turmaId } = await context.params;

    const denied = await guardProfessorTitularTurma(user, schoolId, turmaId);
    if (denied) return denied;

    const turma = await prisma.turma.findFirst({
      where: { id: turmaId, schoolId, ativo: true },
      select: {
        id: true,
        nome: true,
        capacidadeMaxima: true,
        curso: { select: { nome: true } },
        horarios: {
          select: {
            diaSemana: true,
            horaInicio: true,
            horaFim: true,
          },
        },
      },
    });

    if (!turma) {
      return NextResponse.json({ error: "Turma não encontrada." }, { status: 404 });
    }

    const [vinculos, matriculas] = await Promise.all([
      prisma.turmaDisciplina.findMany({
        where: { turmaId, schoolId },
        include: {
          disciplina: { select: { id: true, nome: true } },
        },
        orderBy: { disciplina: { nome: "asc" } },
      }),
      prisma.matricula.findMany({
        where: { turmaId, schoolId, status: "ATIVA" },
        include: {
          aluno: { select: { id: true, nome: true } },
        },
        orderBy: { aluno: { nome: "asc" } },
      }),
    ]);

    return NextResponse.json({
      turma: {
        id: turma.id,
        nome: turma.nome,
        cursoNome: turma.curso.nome,
        capacidadeMaxima: turma.capacidadeMaxima,
        horarios: turma.horarios.map((h) => ({
          diaSemana: h.diaSemana,
          diaLabel: labelDiaSemana(h.diaSemana),
          horaInicio: h.horaInicio,
          horaFim: h.horaFim,
        })),
      },
      disciplinas: vinculos.map((v) => ({
        id: v.disciplina.id,
        nome: v.disciplina.nome,
      })),
      alunos: matriculas.map((m) => ({
        matriculaId: m.id,
        alunoId: m.aluno.id,
        nome: m.aluno.nome,
      })),
    });
  } catch (error) {
    console.error("Erro em GET /api/docente/turmas/[turmaId]:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar a turma." },
      { status: 500 }
    );
  }
}
