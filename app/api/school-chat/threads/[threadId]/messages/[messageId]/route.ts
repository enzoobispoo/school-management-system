import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";
import { mapSchoolChatMessageForViewer } from "@/lib/school-chat/map-chat-message";
import { userParticipatesInThread } from "@/lib/school-chat/thread-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 8000;

interface RouteContext {
  params: Promise<{ threadId: string; messageId: string }>;
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

    const { threadId, messageId } = await ctx.params;

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

    const json = await request.json().catch(() => ({}));
    const pinnedProvided = typeof json.pinned === "boolean";

    if (pinnedProvided) {
      const existing = await prisma.schoolChatMessage.findFirst({
        where: { id: messageId, threadId },
        select: { id: true, deletedAt: true },
      });
      if (!existing) {
        return NextResponse.json({ error: "Mensagem não encontrada." }, { status: 404 });
      }
      if (existing.deletedAt) {
        return NextResponse.json(
          { error: "Não é possível fixar uma mensagem apagada." },
          { status: 400 }
        );
      }

      const updated = await prisma.schoolChatMessage.update({
        where: { id: messageId },
        data: { pinnedAt: json.pinned ? new Date() : null },
        select: {
          id: true,
          body: true,
          attachmentUrl: true,
          attachmentName: true,
          createdAt: true,
          editedAt: true,
          pinnedAt: true,
          deletedAt: true,
          senderUserId: true,
          sender: {
            select: { id: true, nome: true, avatarUrl: true },
          },
        },
      });

      return NextResponse.json(mapSchoolChatMessageForViewer(updated, user.id));
    }

    const existing = await prisma.schoolChatMessage.findFirst({
      where: { id: messageId, threadId },
      select: { id: true, senderUserId: true, body: true, deletedAt: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Mensagem não encontrada." }, { status: 404 });
    }

    if (existing.senderUserId !== user.id) {
      return NextResponse.json(
        { error: "Só é possível editar suas próprias mensagens." },
        { status: 403 }
      );
    }

    if (existing.deletedAt) {
      return NextResponse.json(
        { error: "Esta mensagem foi apagada e não pode ser editada." },
        { status: 400 }
      );
    }

    const bodyText = String(json?.body ?? "").trim();
    if (!bodyText) {
      return NextResponse.json({ error: "Texto da mensagem não pode ficar vazio." }, { status: 400 });
    }
    if (bodyText.length > MAX_BODY) {
      return NextResponse.json({ error: "Mensagem muito longa." }, { status: 400 });
    }

    const updated = await prisma.schoolChatMessage.update({
      where: { id: messageId },
      data: {
        body: bodyText,
        editedAt: new Date(),
      },
      select: {
        id: true,
        body: true,
        attachmentUrl: true,
        attachmentName: true,
        createdAt: true,
        editedAt: true,
        pinnedAt: true,
        deletedAt: true,
        senderUserId: true,
        sender: {
          select: { id: true, nome: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json(mapSchoolChatMessageForViewer(updated, user.id));
  } catch (e) {
    console.error("PATCH school-chat message:", e);
    return NextResponse.json({ error: "Erro ao atualizar mensagem." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, ctx: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const { threadId, messageId } = await ctx.params;

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

    const scope = request.nextUrl.searchParams.get("for") === "me" ? "me" : "all";

    const existing = await prisma.schoolChatMessage.findFirst({
      where: { id: messageId, threadId },
      select: { senderUserId: true, deletedAt: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Mensagem não encontrada." }, { status: 404 });
    }

    if (scope === "all") {
      if (existing.senderUserId !== user.id) {
        return NextResponse.json(
          { error: "Só quem enviou pode apagar para todos." },
          { status: 403 }
        );
      }
      if (!existing.deletedAt) {
        await prisma.schoolChatMessage.update({
          where: { id: messageId },
          data: {
            deletedAt: new Date(),
            body: "",
            attachmentUrl: null,
            attachmentName: null,
            pinnedAt: null,
          },
        });
      }
    } else {
      const p = await prisma.schoolChatParticipant.findUnique({
        where: { threadId_userId: { threadId, userId: user.id } },
        select: { hiddenMessageIds: true },
      });
      const cur = p?.hiddenMessageIds ?? [];
      if (!cur.includes(messageId)) {
        await prisma.schoolChatParticipant.update({
          where: { threadId_userId: { threadId, userId: user.id } },
          data: { hiddenMessageIds: { push: messageId } },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE school-chat message:", e);
    return NextResponse.json({ error: "Erro ao apagar mensagem." }, { status: 500 });
  }
}
