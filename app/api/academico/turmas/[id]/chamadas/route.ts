import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const schoolResult = requireSchool(user);
    if (schoolResult instanceof NextResponse) return schoolResult;
    const { schoolId } = schoolResult;

    const { id: turmaId } = await context.params;
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
            matricula: { include: { aluno: { select: { id: true, nome: true } } } },
          },
        },
      },
      orderBy: { dataAula: "desc" },
      take: 50,
    });

    return NextResponse.json(aulas);
  } catch (error) {
    console.error("Erro ao listar chamadas:", error);
    return NextResponse.json({ error: "Erro ao listar chamadas." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const schoolResult = requireSchool(user);
    if (schoolResult instanceof NextResponse) return schoolResult;
    const { schoolId } = schoolResult;

    const { id: turmaId } = await context.params;
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

    const turma = await prisma.turma.findFirst({
      where: { id: turmaId, schoolId },
      select: { id: true },
    });
    if (!turma) {
      return NextResponse.json({ error: "Turma não encontrada." }, { status: 404 });
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

    const aula = await prisma.$transaction(async (tx) => {
      const createdAula = await tx.aulaRegistro.create({
        data: { schoolId, turmaId, disciplinaId, dataAula, titulo, conteudo },
      });

      await tx.presencaAula.createMany({
        data: presencas.map((p: { matriculaId: string; presente: boolean; observacao?: string }) => ({
          schoolId,
          aulaId: createdAula.id,
          matriculaId: String(p.matriculaId),
          presente: Boolean(p.presente),
          observacao: p.observacao ? String(p.observacao) : null,
        })),
        skipDuplicates: true,
      });

      return createdAula;
    });

    return NextResponse.json(aula, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar chamada:", error);
    return NextResponse.json({ error: "Erro ao registrar chamada." }, { status: 500 });
  }
}

