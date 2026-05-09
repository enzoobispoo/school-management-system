import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";
import { blockProfessorWhenPortalDisabled } from "@/lib/docente/professor-portal-policy";
import { userParticipatesInThread } from "@/lib/school-chat/thread-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ threadId: string }>;
}

export async function GET(_request: NextRequest, ctx: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const portalDenied = await blockProfessorWhenPortalDisabled(user);
    if (portalDenied) return portalDenied;

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

    const rows = await prisma.schoolChatMessage.findMany({
      where: { threadId, attachmentUrl: { not: null }, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        attachmentUrl: true,
        attachmentName: true,
        createdAt: true,
        senderUserId: true,
        sender: { select: { nome: true } },
      },
    });

    return NextResponse.json({
      data: rows.map((r) => ({
        id: r.id,
        attachmentUrl: r.attachmentUrl,
        attachmentName: r.attachmentName,
        createdAt: r.createdAt.toISOString(),
        fromSelf: r.senderUserId === user.id,
        senderNome: r.sender.nome,
      })),
    });
  } catch (e) {
    console.error("GET school-chat media:", e);
    return NextResponse.json({ error: "Erro ao carregar mídias." }, { status: 500 });
  }
}
