import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ valid: false });

  const entry = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!entry || entry.usedAt || entry.expiresAt < new Date()) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true, email: entry.email });
}

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
    }

    const entry = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!entry || entry.usedAt || entry.expiresAt < new Date()) {
      return NextResponse.json({ error: "Link expirado ou inválido. Solicite um novo." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: entry.email } });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await Promise.all([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro reset-password:", error);
    return NextResponse.json({ error: "Erro ao redefinir senha." }, { status: 500 });
  }
}
