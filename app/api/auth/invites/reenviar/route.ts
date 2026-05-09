import { NextRequest, NextResponse } from "next/server";
import { createInviteToken } from "@/lib/auth/invite-token";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { sendInviteEmail } from "@/lib/email/send-invite-email";
import { API_FORBIDDEN_PROFILE } from "@/lib/http/api-forbidden";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatRoleLabel(role: string) {
  const map: Record<string, string> = {
    ADMIN: "Administrador", FINANCEIRO: "Financeiro",
    SECRETARIA: "Secretaria (acadêmica)",
    SECRETARIA_FINANCEIRA: "Secretaria (com financeiro no painel)",
    PROFESSOR: "Professor",
  };
  return map[role] ?? "Usuário";
}

function canManageInvites(role: string) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !canManageInvites(currentUser.role)) {
      return NextResponse.json({ error: API_FORBIDDEN_PROFILE }, { status: 403 });
    }

    const body = await request.json();
    const inviteId =
      typeof body?.inviteId === "string" ? body.inviteId.trim() : "";
    const email = String(body?.email ?? "")
      .trim()
      .toLowerCase();

    const conviteAnterior = inviteId
      ? await prisma.userInvite.findFirst({
          where: { id: inviteId, usedAt: null },
        })
      : email
        ? await prisma.userInvite.findFirst({
            where: { email, usedAt: null },
            orderBy: { createdAt: "desc" },
          })
        : null;

    if (!conviteAnterior) {
      return NextResponse.json(
        {
          error: inviteId
            ? "Convite não encontrado ou já utilizado."
            : "Informe inviteId ou e-mail válido.",
        },
        { status: 404 }
      );
    }

    if (currentUser.role === "ADMIN") {
      if (
        !currentUser.schoolId ||
        conviteAnterior.schoolId !== currentUser.schoolId
      ) {
        return NextResponse.json({ error: API_FORBIDDEN_PROFILE }, { status: 403 });
      }
    }

    const { token, tokenHash } = createInviteToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    await prisma.userInvite.update({
      where: { id: conviteAnterior.id },
      data: { tokenHash, expiresAt },
    });

    const inviteLink = `${request.nextUrl.origin}/ativar-conta/${token}`;

    await sendInviteEmail({
      to: conviteAnterior.email,
      inviteLink,
      roleLabel: formatRoleLabel(conviteAnterior.role),
      expiresAt,
    });

    return NextResponse.json({ success: true, inviteLink, expiresAt });
  } catch (error) {
    console.error("Erro ao reenviar convite:", error);
    return NextResponse.json({ error: "Não foi possível reenviar o convite." }, { status: 500 });
  }
}
