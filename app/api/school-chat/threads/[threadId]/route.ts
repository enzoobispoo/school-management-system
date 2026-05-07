import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";
import { userParticipatesInThread } from "@/lib/school-chat/thread-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ threadId: string }>;
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const { threadId } = await ctx.params;
    const ok = await userParticipatesInThread(user.id, threadId);
    if (!ok) {
      return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
    }

    const thread = await prisma.schoolChatThread.findFirst({
      where: { id: threadId, schoolId },
      select: { id: true },
    });
    if (!thread) {
      return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const pinnedRaw = body?.pinned;
    const hideForMeRaw = body?.hideForMe;

    const hasPinned = typeof pinnedRaw === "boolean";
    const hasHide = typeof hideForMeRaw === "boolean";

    if (!hasPinned && !hasHide) {
      return NextResponse.json(
        { error: "Informe pinned e/ou hideForMe (boolean)." },
        { status: 400 }
      );
    }

    const data: {
      pinnedAt?: Date | null;
      hiddenAt?: Date | null;
    } = {};

    if (hasPinned) {
      data.pinnedAt = pinnedRaw ? new Date() : null;
    }
    if (hasHide) {
      data.hiddenAt = hideForMeRaw ? new Date() : null;
    }

    await prisma.schoolChatParticipant.update({
      where: {
        threadId_userId: {
          threadId,
          userId: user.id,
        },
      },
      data,
    });

    return NextResponse.json({
      ok: true,
      ...(hasPinned ? { pinned: pinnedRaw as boolean } : {}),
      ...(hasHide ? { hideForMe: hideForMeRaw as boolean } : {}),
    });
  } catch (e) {
    console.error("PATCH school-chat thread:", e);
    return NextResponse.json({ error: "Erro ao atualizar conversa." }, { status: 500 });
  }
}
