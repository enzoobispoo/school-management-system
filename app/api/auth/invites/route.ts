import { NextRequest, NextResponse } from "next/server";
import { createInviteToken } from "@/lib/auth/invite-token";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { sendInviteEmail } from "@/lib/email/send-invite-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "FINANCEIRO", "SECRETARIA", "PROFESSOR"] as const;

function formatRoleLabel(role: string) {
  switch (role) {
    case "ADMIN":
      return "Administrador";
    case "FINANCEIRO":
      return "Financeiro";
    case "SECRETARIA":
      return "Secretaria";
    case "PROFESSOR":
      return "Professor";
    default:
      return "Usuário";
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);

    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const email = String(body?.email ?? "").trim().toLowerCase();
    const role = String(body?.role ?? "").trim().toUpperCase();

    if (!email) {
      return NextResponse.json(
        { error: "O e-mail é obrigatório." },
        { status: 400 }
      );
    }

    if (!ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
      return NextResponse.json(
        { error: "Perfil inválido." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser?.ativo) {
      return NextResponse.json(
        { error: "Já existe um usuário ativo com esse e-mail." },
        { status: 400 }
      );
    }

    const { token, tokenHash } = createInviteToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    await prisma.userInvite.create({
      data: {
        email,
        role: role as "ADMIN" | "FINANCEIRO" | "SECRETARIA" | "PROFESSOR",
        tokenHash,
        expiresAt,
      },
    });

    const inviteLink = `${request.nextUrl.origin}/ativar-conta/${token}`;

    await sendInviteEmail({
      to: email,
      inviteLink,
      roleLabel: formatRoleLabel(role),
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      inviteLink,
      expiresAt,
      emailSent: true,
    });
  } catch (error) {
    console.error("Erro ao criar convite:", error);

    return NextResponse.json(
      { error: "Não foi possível criar o convite." },
      { status: 500 }
    );
  }
}