import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";
import { guardProfessorTitularTurma } from "@/lib/docente/guard-professor-turma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ turmaId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
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

    const params = new URL(request.url).searchParams;
    const disciplinaId = params.get("disciplinaId") || undefined;
    const start = params.get("start");
    const end = params.get("end");
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    if (endDate) endDate.setHours(23, 59, 59, 999);

    const aulas = await prisma.aulaRegistro.findMany({
      where: {
        schoolId,
        turmaId,
        disciplinaId,
        ...(startDate || endDate
          ? {
              dataAula: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      include: {
        disciplina: { select: { id: true, nome: true } },
        presencas: {
          include: {
            matricula: {
              include: {
                aluno: { select: { id: true, nome: true } },
              },
            },
          },
        },
      },
      orderBy: { dataAula: "desc" },
      take: 40,
    });

    return NextResponse.json(aulas);
  } catch (error) {
    console.error("Erro em GET docente chamadas:", error);
    return NextResponse.json(
      { error: "Erro ao listar chamadas." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
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

    const body = await request.json();
    const disciplinaId = String(body?.disciplinaId || "");
    const dataAula = body?.dataAula ? new Date(body.dataAula) : null;
    const titulo = body?.titulo ? String(body.titulo) : null;
    const conteudo = body?.conteudo ? String(body.conteudo) : null;
    const presencas = Array.isArray(body?.presencas) ? body.presencas : [];

    if (!disciplinaId || !dataAula || presencas.length === 0) {
      return NextResponse.json(
        { error: "disciplinaId, dataAula e presencas são obrigatórios." },
        { status: 400 }
      );
    }

    const hasDisciplina = await prisma.turmaDisciplina.findFirst({
      where: { schoolId, turmaId, disciplinaId },
      select: { id: true },
    });
    if (!hasDisciplina) {
      return NextResponse.json(
        { error: "Disciplina não vinculada à turma." },
        { status: 400 }
      );
    }

    const ids: string[] = (presencas as { matriculaId?: string }[]).map(
      (p) => String(p?.matriculaId || "").trim()
    );
    const uniqueIds = Array.from(
      new Set(ids.filter((id: string) => id.length > 0))
    );
    if (uniqueIds.length === 0) {
      return NextResponse.json(
        { error: "Informe ao menos uma presença." },
        { status: 400 }
      );
    }

    const valid = await prisma.matricula.findMany({
      where: {
        schoolId,
        turmaId,
        status: "ATIVA",
        id: { in: uniqueIds },
      },
      select: { id: true },
    });
    if (valid.length !== uniqueIds.length) {
      return NextResponse.json(
        { error: "Uma ou mais matrículas são inválidas para esta turma." },
        { status: 400 }
      );
    }

    const aula = await prisma.$transaction(async (tx) => {
      const createdAula = await tx.aulaRegistro.create({
        data: { schoolId, turmaId, disciplinaId, dataAula, titulo, conteudo },
      });

      await tx.presencaAula.createMany({
        data: presencas.map(
          (p: {
            matriculaId: string;
            presente: boolean;
            observacao?: string;
          }) => ({
            schoolId,
            aulaId: createdAula.id,
            matriculaId: String(p.matriculaId),
            presente: Boolean(p.presente),
            observacao: p.observacao ? String(p.observacao) : null,
          })
        ),
        skipDuplicates: true,
      });

      return createdAula;
    });

    return NextResponse.json(aula, { status: 201 });
  } catch (error) {
    console.error("Erro em POST docente chamadas:", error);
    return NextResponse.json(
      { error: "Erro ao registrar chamada." },
      { status: 500 }
    );
  }
}
