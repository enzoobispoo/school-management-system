import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const schoolResult = requireSchool(user);
    if (schoolResult instanceof NextResponse) return schoolResult;
    const { schoolId } = schoolResult;

    const { id: avaliacaoId } = await context.params;
    const body = await request.json();
    const notas = Array.isArray(body?.notas) ? body.notas : [];

    if (notas.length === 0) {
      return NextResponse.json({ error: "Nenhuma nota informada." }, { status: 400 });
    }

    const avaliacao = await prisma.avaliacao.findFirst({
      where: { id: avaliacaoId, schoolId },
      select: { id: true, turmaId: true },
    });
    if (!avaliacao) {
      return NextResponse.json({ error: "Avaliação não encontrada." }, { status: 404 });
    }

    await prisma.$transaction(
      notas.map((item: { matriculaId: string; nota: number; observacao?: string }) =>
        prisma.notaAvaliacao.upsert({
          where: {
            avaliacaoId_matriculaId: {
              avaliacaoId,
              matriculaId: String(item.matriculaId),
            },
          },
          create: {
            schoolId,
            avaliacaoId,
            matriculaId: String(item.matriculaId),
            nota: Number(item.nota),
            observacao: item.observacao ? String(item.observacao) : null,
          },
          update: {
            nota: Number(item.nota),
            observacao: item.observacao ? String(item.observacao) : null,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao lançar notas:", error);
    return NextResponse.json({ error: "Erro ao lançar notas." }, { status: 500 });
  }
}

