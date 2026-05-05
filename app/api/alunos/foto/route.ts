import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const TIPOS_VALIDOS = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const alunoId = formData.get("alunoId") as string;

    if (!file || !alunoId) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    if (!TIPOS_VALIDOS.includes(file.type)) {
      return NextResponse.json({ error: "Apenas JPG, PNG ou WebP são aceitos." }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Imagem muito grande. Máximo 5MB." }, { status: 400 });
    }

    const aluno = await prisma.aluno.findUnique({ where: { id: alunoId }, select: { id: true, fotoUrl: true } });
    if (!aluno) return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });

    // Remove foto anterior se existir
    if (aluno.fotoUrl) {
      await del(aluno.fotoUrl).catch(() => {});
    }

    const ext = file.type.split("/")[1];
    const blob = await put(`fotos/${alunoId}.${ext}`, file, {
      access: "public",
      contentType: file.type,
    });

    await prisma.aluno.update({
      where: { id: alunoId },
      data: { fotoUrl: blob.url },
    });

    return NextResponse.json({ fotoUrl: blob.url });
  } catch (error) {
    console.error("Erro ao fazer upload da foto:", error);
    return NextResponse.json({ error: "Erro ao fazer upload da foto." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const { alunoId } = await request.json();
    const aluno = await prisma.aluno.findUnique({ where: { id: alunoId }, select: { fotoUrl: true } });

    if (aluno?.fotoUrl) {
      await del(aluno.fotoUrl).catch(() => {});
    }

    await prisma.aluno.update({ where: { id: alunoId }, data: { fotoUrl: null } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao remover foto." }, { status: 500 });
  }
}
