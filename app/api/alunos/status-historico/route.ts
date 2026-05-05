import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const alunoId = request.nextUrl.searchParams.get("alunoId");
    if (!alunoId) return NextResponse.json({ error: "alunoId obrigatório." }, { status: 400 });

    const aluno = await prisma.aluno.findFirst({
      where: { id: alunoId, schoolId },
      select: { id: true },
    });
    if (!aluno) return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });

    const historico = await prisma.alunoStatusHistorico.findMany({
      where: { alunoId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(historico);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar histórico." }, { status: 500 });
  }
}
