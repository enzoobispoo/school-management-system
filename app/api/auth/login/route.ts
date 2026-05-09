import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, signAuthToken } from "@/lib/auth/session";
import { getClientIp } from "@/lib/security/request-ip";
import { rateLimitOrFail } from "@/lib/security/rate-limit";
import { jsonTooManyRequests } from "@/lib/security/rate-limit-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const loginLimit = rateLimitOrFail(`auth:login:${ip}`, 35, 15 * 60 * 1000);
    if (!loginLimit.ok) {
      return jsonTooManyRequests(loginLimit);
    }

    const body = await request.json();

    const identifier = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Usuário e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        ativo: true,
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário ou senha inválidos." },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Usuário ou senha inválidos." },
        { status: 401 }
      );
    }

    if (user.role === "PROFESSOR" && user.schoolId) {
      const escola = await prisma.escolaSettings.findUnique({
        where: { schoolId: user.schoolId },
        select: { professorPortalEnabled: true },
      });
      const portalOk = escola?.professorPortalEnabled ?? true;
      if (!portalOk) {
        return NextResponse.json(
          {
            error:
              "O portal do professor está desativado para esta escola. Procure a secretaria.",
            code: "PROFESSOR_PORTAL_DISABLED",
          },
          { status: 403 }
        );
      }
    }

    const token = await signAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId ?? null,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nome: user.nome,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Erro ao realizar login:", error);

    return NextResponse.json(
      { error: "Não foi possível realizar o login." },
      { status: 500 }
    );
  }
}