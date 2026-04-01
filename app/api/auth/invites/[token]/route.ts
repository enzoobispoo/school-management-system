import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashInviteToken } from "@/lib/auth/invite-token";
import { getOrCreateSchoolSetting } from "@/lib/school";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ token: string }>;
}

function isValidUsername(username: string) {
  return /^[a-zA-Z0-9._-]{3,30}$/.test(username);
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const tokenHash = hashInviteToken(token);

    const invite = await prisma.userInvite.findUnique({
      where: { tokenHash },
    });

    if (!invite || invite.usedAt || invite.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Convite inválido ou expirado." },
        { status: 404 }
      );
    }

    const school = await getOrCreateSchoolSetting();

    return NextResponse.json({
      invite: {
        email: invite.email,
        role: invite.role,
        schoolName: school.nome,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    console.error("Erro ao validar convite:", error);

    return NextResponse.json(
      { error: "Não foi possível validar o convite." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const tokenHash = hashInviteToken(token);

    const body = await request.json();

    const schoolName = String(body?.schoolName ?? "").trim();
    const nome = String(body?.nome ?? "").trim();
    const username = String(body?.username ?? "")
      .trim()
      .toLowerCase();
    const password = String(body?.password ?? "");

    if (!schoolName) {
      return NextResponse.json(
        { error: "O nome da escola é obrigatório." },
        { status: 400 }
      );
    }

    if (!nome) {
      return NextResponse.json(
        { error: "O nome é obrigatório." },
        { status: 400 }
      );
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        {
          error:
            "O nome de usuário deve ter entre 3 e 30 caracteres e usar apenas letras, números, ponto, underline ou hífen.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 8 caracteres." },
        { status: 400 }
      );
    }

    const invite = await prisma.userInvite.findUnique({
      where: { tokenHash },
    });

    if (!invite || invite.usedAt || invite.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Convite inválido ou expirado." },
        { status: 404 }
      );
    }

    const usernameInUse = await prisma.user.findFirst({
      where: {
        username,
        NOT: {
          email: invite.email,
        },
      },
    });

    if (usernameInUse) {
      return NextResponse.json(
        { error: "Esse nome de usuário já está em uso." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
    });

    const activeUsersCount = await prisma.user.count({
      where: { ativo: true },
    });

    const school = await getOrCreateSchoolSetting();

    if (activeUsersCount === 0 || school.nome === "EduGestão") {
      await prisma.schoolSetting.upsert({
        where: { id: "default" },
        update: { nome: schoolName },
        create: {
          id: "default",
          nome: schoolName,
        },
      });
    }

    let user;

    if (existingUser) {
      if (existingUser.ativo) {
        return NextResponse.json(
          { error: "Já existe um usuário ativo com este e-mail." },
          { status: 400 }
        );
      }

      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          nome,
          username,
          passwordHash,
          role: invite.role,
          ativo: true,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          nome,
          username,
          email: invite.email,
          passwordHash,
          role: invite.role,
          ativo: true,
        },
      });
    }

    await prisma.userInvite.update({
      where: { id: invite.id },
      data: {
        usedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nome: user.nome,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erro ao ativar conta:", error);

    return NextResponse.json(
      { error: "Não foi possível ativar a conta." },
      { status: 500 }
    );
  }
}
