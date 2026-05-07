import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { PASSWORD_MIN_LENGTH } from "@/lib/validations/password-policy";
import { hashPasswordResetToken } from "@/lib/security/reset-token-hash";
import { getClientIp } from "@/lib/security/request-ip";
import { rateLimitOrFail } from "@/lib/security/rate-limit";
import { jsonTooManyRequests } from "@/lib/security/rate-limit-http";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimitOrFail(`auth:reset:get:${ip}`, 80, 15 * 60 * 1000);
  if (!rl.ok) {
    return jsonTooManyRequests(rl);
  }

  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!token) return NextResponse.json({ valid: false });

  const tokenHash = hashPasswordResetToken(token);
  const entry = await prisma.passwordResetToken.findUnique({
    where: { token: tokenHash },
  });
  if (!entry || entry.usedAt || entry.expiresAt < new Date()) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true });
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimitOrFail(`auth:reset:post:${ip}`, 15, 60 * 60 * 1000);
    if (!rl.ok) {
      return jsonTooManyRequests(rl);
    }

    const { token, password } = await request.json();

    if (!token || typeof token !== "string" || !password) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const trimmedToken = token.trim();
    if (!trimmedToken) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    if (
      typeof password !== "string" ||
      password.length < PASSWORD_MIN_LENGTH
    ) {
      return NextResponse.json(
        {
          error: `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`,
        },
        { status: 400 }
      );
    }

    const tokenHash = hashPasswordResetToken(trimmedToken);
    const entry = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
    });
    if (!entry || entry.usedAt || entry.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Link expirado ou inválido. Solicite um novo." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: entry.email },
    });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await Promise.all([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      prisma.passwordResetToken.update({
        where: { token: tokenHash },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro reset-password:", error);
    return NextResponse.json(
      { error: "Erro ao redefinir senha." },
      { status: 500 }
    );
  }
}
