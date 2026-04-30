import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { senhaAtual, novaSenha } = await request.json();

    if (!senhaAtual || !novaSenha) {
      return NextResponse.json(
        { error: "Preencha todos os campos." },
        { status: 400 }
      );
    }

    if (novaSenha.length < 6) {
      return NextResponse.json(
        { error: "A nova senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    const valid = await bcrypt.compare(senhaAtual, user.passwordHash);

    if (!valid) {
      return NextResponse.json(
        { error: "Senha atual incorreta." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(novaSenha, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao alterar senha." },
      { status: 500 }
    );
  }
}
