import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";

const TIPOS_VALIDOS = ["laudo", "receita", "exame", "outro"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

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

    const documentos = await prisma.alunoDocumento.findMany({
      where: { alunoId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documentos);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar documentos." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const alunoId = formData.get("alunoId") as string;
    const tipo = formData.get("tipo") as string;
    const nome = formData.get("nome") as string;

    if (!file || !alunoId || !tipo || !nome) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    if (!TIPOS_VALIDOS.includes(tipo)) {
      return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Arquivo muito grande. Máximo 10MB." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Apenas arquivos PDF são aceitos." }, { status: 400 });
    }

    const aluno = await prisma.aluno.findFirst({
      where: { id: alunoId, schoolId },
      select: { id: true },
    });
    if (!aluno) return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });

    const blob = await put(`documentos/${alunoId}/${Date.now()}-${file.name}`, file, {
      access: "public",
      contentType: "application/pdf",
    });

    const documento = await prisma.alunoDocumento.create({
      data: {
        alunoId,
        nome,
        tipo,
        url: blob.url,
        tamanho: file.size,
      },
    });

    return NextResponse.json(documento, { status: 201 });
  } catch (error) {
    console.error("Erro ao fazer upload:", error);
    return NextResponse.json({ error: "Erro ao fazer upload do documento." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id obrigatório." }, { status: 400 });

    const doc = await prisma.alunoDocumento.findUnique({
      where: { id },
      include: { aluno: { select: { schoolId: true } } },
    });
    if (!doc || doc.aluno.schoolId !== schoolId) {
      return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
    }

    // Remove do Blob
    const { del } = await import("@vercel/blob");
    await del(doc.url);

    await prisma.alunoDocumento.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar documento:", error);
    return NextResponse.json({ error: "Erro ao deletar documento." }, { status: 500 });
  }
}
