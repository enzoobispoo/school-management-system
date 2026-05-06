import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const schoolResult = requireSchool(user);
    if (schoolResult instanceof NextResponse) return schoolResult;
    const { schoolId } = schoolResult;

    const { searchParams } = new URL(request.url);
    const turmaId = searchParams.get("turmaId") || undefined;
    const disciplinaId = searchParams.get("disciplinaId") || undefined;
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    if (endDate) endDate.setHours(23, 59, 59, 999);

    const avaliacoes = await prisma.avaliacao.findMany({
      where: {
        schoolId,
        turmaId,
        disciplinaId,
        ...(startDate || endDate
          ? {
              dataAvaliacao: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      include: {
        disciplina: { select: { id: true, nome: true } },
        professor: { select: { id: true, nome: true } },
        notas: {
          include: {
            matricula: { include: { aluno: { select: { id: true, nome: true } } } },
          },
        },
      },
      orderBy: { dataAvaliacao: "desc" },
    });

    return NextResponse.json(
      avaliacoes.map((a) => ({
        ...a,
        peso: a.peso ? Number(a.peso) : null,
        notas: a.notas.map((n) => ({ ...n, nota: Number(n.nota) })),
      }))
    );
  } catch (error) {
    console.error("Erro ao listar avaliações:", error);
    return NextResponse.json({ error: "Erro ao listar avaliações." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const schoolResult = requireSchool(user);
    if (schoolResult instanceof NextResponse) return schoolResult;
    const { schoolId } = schoolResult;

    const body = await request.json();
    const turmaId = String(body?.turmaId || "");
    const disciplinaId = String(body?.disciplinaId || "");
    const titulo = String(body?.titulo || "").trim();
    const descricao = body?.descricao ? String(body.descricao).trim() : null;
    const peso = body?.peso !== undefined && body?.peso !== null ? Number(body.peso) : null;
    const dataAvaliacao = body?.dataAvaliacao ? new Date(body.dataAvaliacao) : null;

    if (!turmaId || !disciplinaId || !titulo || !dataAvaliacao) {
      return NextResponse.json(
        { error: "turmaId, disciplinaId, titulo e dataAvaliacao são obrigatórios." },
        { status: 400 }
      );
    }

    const turma = await prisma.turma.findFirst({
      where: { id: turmaId, schoolId },
      select: { id: true, professorId: true },
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

    const avaliacao = await prisma.avaliacao.create({
      data: {
        schoolId,
        turmaId,
        disciplinaId,
        professorId: turma.professorId,
        titulo,
        descricao,
        peso,
        dataAvaliacao,
      },
    });

    return NextResponse.json(
      { ...avaliacao, peso: avaliacao.peso ? Number(avaliacao.peso) : null },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar avaliação:", error);
    return NextResponse.json({ error: "Erro ao criar avaliação." }, { status: 500 });
  }
}

