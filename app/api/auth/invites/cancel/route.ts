import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { API_FORBIDDEN_PROFILE } from "@/lib/http/api-forbidden";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function canCancelInvites(role: string) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !canCancelInvites(currentUser.role)) {
      return NextResponse.json({ error: API_FORBIDDEN_PROFILE }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const inviteId = typeof body?.inviteId === "string" ? body.inviteId.trim() : "";
    if (!inviteId) {
      return NextResponse.json({ error: "inviteId é obrigatório." }, { status: 400 });
    }

    const invite = await prisma.userInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite || invite.usedAt) {
      return NextResponse.json(
        { error: "Convite não encontrado ou já utilizado." },
        { status: 404 }
      );
    }

    if (currentUser.role === "ADMIN") {
      if (!currentUser.schoolId || invite.schoolId !== currentUser.schoolId) {
        return NextResponse.json({ error: API_FORBIDDEN_PROFILE }, { status: 403 });
      }
    }

    await prisma.userInvite.delete({ where: { id: inviteId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao cancelar convite:", error);
    return NextResponse.json(
      { error: "Não foi possível cancelar o convite." },
      { status: 500 }
    );
  }
}
