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
    const { id } = await context.params;

    const matricula = await prisma.matricula.findFirst({
      where: { id, schoolId },
      include: {
        aluno: { select: { id: true, nome: true } },
        turma: { select: { id: true, nome: true } },
        notas: {
          include: {
            avaliacao: { include: { disciplina: { select: { id: true, nome: true } } } },
          },
        },
        presencas: {
          include: {
            aula: { include: { disciplina: { select: { id: true, nome: true } } } },
          },
        },
      },
    });

    if (!matricula) {
      return NextResponse.json({ error: "Matrícula não encontrada." }, { status: 404 });
    }

    const byDisciplina = new Map<
      string,
      {
        disciplinaId: string;
        disciplinaNome: string;
        notas: number[];
        presencas: number;
        faltas: number;
      }
    >();

    for (const nota of matricula.notas) {
      const key = nota.avaliacao.disciplina.id;
      const current = byDisciplina.get(key) || {
        disciplinaId: key,
        disciplinaNome: nota.avaliacao.disciplina.nome,
        notas: [],
        presencas: 0,
        faltas: 0,
      };
      current.notas.push(Number(nota.nota));
      byDisciplina.set(key, current);
    }

    for (const presenca of matricula.presencas) {
      const key = presenca.aula.disciplina.id;
      const current = byDisciplina.get(key) || {
        disciplinaId: key,
        disciplinaNome: presenca.aula.disciplina.nome,
        notas: [],
        presencas: 0,
        faltas: 0,
      };
      if (presenca.presente) current.presencas += 1;
      else current.faltas += 1;
      byDisciplina.set(key, current);
    }

    const disciplinas = Array.from(byDisciplina.values()).map((item) => {
      const media =
        item.notas.length > 0
          ? item.notas.reduce((acc, n) => acc + n, 0) / item.notas.length
          : null;
      const totalChamadas = item.presencas + item.faltas;
      const frequencia =
        totalChamadas > 0 ? (item.presencas / totalChamadas) * 100 : null;
      return {
        ...item,
        media,
        frequencia,
      };
    });

    return NextResponse.json({
      matriculaId: matricula.id,
      aluno: matricula.aluno,
      turma: matricula.turma,
      disciplinas,
    });
  } catch (error) {
    console.error("Erro ao gerar boletim:", error);
    return NextResponse.json({ error: "Erro ao gerar boletim." }, { status: 500 });
  }
}

