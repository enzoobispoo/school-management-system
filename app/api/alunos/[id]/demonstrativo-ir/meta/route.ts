import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const { id: alunoId } = await context.params;

    const aluno = await prisma.aluno.findFirst({
      where: { id: alunoId, schoolId },
      select: {
        nome: true,
        responsavelNome: true,
        responsavelEmail: true,
        responsavelTelefone: true,
        email: true,
        telefone: true,
      },
    });

    if (!aluno) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const email = aluno.responsavelEmail?.trim() || aluno.email?.trim() || null;
    const telefone = aluno.responsavelTelefone?.trim() || aluno.telefone?.trim() || null;
    const nomeDestinatario = aluno.responsavelNome?.trim() || aluno.nome;

    return NextResponse.json({
      nomeDestinatario,
      email,
      telefone,
      hasEmail: Boolean(email),
      hasWhatsApp: Boolean(telefone),
    });
  } catch (error) {
    console.error("demonstrativo-ir/meta:", error);
    return NextResponse.json({ error: "Erro ao carregar dados" }, { status: 500 });
  }
}
