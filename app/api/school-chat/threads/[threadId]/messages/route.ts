import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import {
  EntidadeNotificacao,
  SchoolChatThreadKind,
  TipoNotificacao,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";
import { userParticipatesInThread } from "@/lib/school-chat/thread-access";
import { mapSchoolChatMessageForViewer } from "@/lib/school-chat/map-chat-message";
import { viewerCanPostSchoolChat } from "@/lib/school-chat/write-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 8000;
const MAX_FILE = 12 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "text/plain",
]);

interface RouteContext {
  params: Promise<{ threadId: string }>;
}

export async function GET(request: NextRequest, ctx: RouteContext) {
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

    const threadRow = await prisma.schoolChatThread.findFirst({
      where: { id: threadId, schoolId },
      select: {
        id: true,
        kind: true,
        title: true,
        ownerUserId: true,
        writePolicy: true,
      },
    });
    if (!threadRow) {
      return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
    }

    const take = Math.min(
      Math.max(Number(request.nextUrl.searchParams.get("take") || "40"), 1),
      100
    );
    const before = request.nextUrl.searchParams.get("before");

    const viewerParticipant = await prisma.schoolChatParticipant.findUnique({
      where: {
        threadId_userId: { threadId, userId: user.id },
      },
      select: { hiddenMessageIds: true },
    });
    const hiddenIds = viewerParticipant?.hiddenMessageIds ?? [];

    const [messages, pinnedRows] = await Promise.all([
      prisma.schoolChatMessage.findMany({
        where: {
          threadId,
          ...(hiddenIds.length ? { id: { notIn: hiddenIds } } : {}),
          ...(before ?
            {
              createdAt: {
                lt: new Date(before),
              },
            }
          : {}),
        },
        orderBy: { createdAt: "desc" },
        take,
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
      }),
      prisma.schoolChatMessage.findMany({
        where: {
          threadId,
          pinnedAt: { not: null },
          deletedAt: null,
          ...(hiddenIds.length ? { id: { notIn: hiddenIds } } : {}),
        },
        orderBy: { pinnedAt: "desc" },
        take: 20,
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
      }),
    ]);

    const chronological = [...messages].reverse();

    const viewerCanPost = viewerCanPostSchoolChat({
      kind: threadRow.kind,
      writePolicy: threadRow.writePolicy,
      ownerUserId: threadRow.ownerUserId,
      viewerUserId: user.id,
    });

    const othersParticipants = await prisma.schoolChatParticipant.findMany({
      where: { threadId, userId: { not: user.id } },
      select: { lastReadAt: true },
    });

    const counterpartLastReadAt =
      threadRow.kind === SchoolChatThreadKind.DIRECT ?
        othersParticipants[0]?.lastReadAt?.toISOString() ?? null
      : null;

    const othersLastReadAt =
      threadRow.kind === SchoolChatThreadKind.GROUP ?
        othersParticipants.map((o) => o.lastReadAt?.toISOString() ?? null)
      : [];

    let peer:
      | {
          id: string;
          nome: string;
          email: string;
          role: string;
          avatarUrl: string | null;
        }
      | null = null;

    if (threadRow.kind === SchoolChatThreadKind.DIRECT) {
      const other = await prisma.schoolChatParticipant.findFirst({
        where: { threadId, userId: { not: user.id } },
        include: {
          user: {
            select: {
              id: true,
              nome: true,
              email: true,
              role: true,
              avatarUrl: true,
            },
          },
        },
      });
      peer = other?.user ?? null;
    }

    await prisma.$transaction([
      prisma.schoolChatParticipant.update({
        where: {
          threadId_userId: {
            threadId,
            userId: user.id,
          },
        },
        data: { lastReadAt: new Date(), hiddenAt: null },
      }),
      prisma.notificacao.updateMany({
        where: {
          schoolId,
          tipo: TipoNotificacao.NOVA_MENSAGEM_CHAT,
          entidadeTipo: EntidadeNotificacao.CHAT_THREAD,
          entidadeId: threadId,
          destinatarioUserId: user.id,
          lida: false,
        },
        data: { lida: true },
      }),
    ]);

    return NextResponse.json({
      pinned: pinnedRows.map((m) => mapSchoolChatMessageForViewer(m, user.id)),
      data: chronological.map((m) => mapSchoolChatMessageForViewer(m, user.id)),
      thread: {
        kind:
          threadRow.kind === SchoolChatThreadKind.GROUP ? "group" : "direct",
        title: threadRow.title,
        peer,
        writePolicy: threadRow.writePolicy,
        viewerCanPost,
        counterpartLastReadAt,
        othersLastReadAt,
      },
    });
  } catch (e) {
    console.error("GET school-chat messages:", e);
    return NextResponse.json({ error: "Erro ao carregar mensagens." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, ctx: RouteContext) {
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

    const threadRow = await prisma.schoolChatThread.findFirst({
      where: { id: threadId, schoolId },
      select: {
        id: true,
        kind: true,
        writePolicy: true,
        ownerUserId: true,
      },
    });
    if (!threadRow) {
      return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
    }

    if (
      !viewerCanPostSchoolChat({
        kind: threadRow.kind,
        writePolicy: threadRow.writePolicy,
        ownerUserId: threadRow.ownerUserId,
        viewerUserId: user.id,
      })
    ) {
      return NextResponse.json(
        {
          error:
            "Neste grupo apenas quem criou pode enviar mensagens.",
        },
        { status: 403 }
      );
    }

    const ct = request.headers.get("content-type") || "";
    let bodyText = "";
    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;

    if (ct.includes("multipart/form-data")) {
      const form = await request.formData();
      bodyText = String(form.get("body") || "").trim();
      const file = form.get("file");
      if (file instanceof File && file.size > 0) {
        if (file.size > MAX_FILE) {
          return NextResponse.json(
            { error: "Arquivo muito grande (máx. 12MB)." },
            { status: 400 }
          );
        }
        const mime = file.type || "application/octet-stream";
        if (!ALLOWED_MIME.has(mime)) {
          return NextResponse.json(
            { error: "Tipo de arquivo não permitido." },
            { status: 400 }
          );
        }
        const safeName = file.name.replace(/[^\w.\-()\s]/g, "_").slice(0, 180);
        const path = `school-chat/${schoolId}/${threadId}/${Date.now()}-${safeName}`;
        const blob = await put(path, file, { access: "public", contentType: mime });
        attachmentUrl = blob.url;
        attachmentName = file.name;
      }
    } else {
      const json = await request.json().catch(() => ({}));
      bodyText = String(json?.body ?? "").trim();
    }

    if (!bodyText && !attachmentUrl) {
      return NextResponse.json(
        { error: "Envie uma mensagem ou um arquivo." },
        { status: 400 }
      );
    }

    if (bodyText.length > MAX_BODY) {
      return NextResponse.json({ error: "Mensagem muito longa." }, { status: 400 });
    }

    const msg = await prisma.$transaction(async (tx) => {
      const m = await tx.schoolChatMessage.create({
        data: {
          threadId,
          senderUserId: user.id,
          body: bodyText || (attachmentName ? `📎 ${attachmentName}` : ""),
          attachmentUrl,
          attachmentName,
        },
        include: {
          sender: { select: { id: true, nome: true, avatarUrl: true } },
        },
      });

      await tx.schoolChatThread.update({
        where: { id: threadId },
        data: { lastMessageAt: m.createdAt },
      });

      const recipients = await tx.schoolChatParticipant.findMany({
        where: { threadId, userId: { not: user.id } },
        select: { userId: true },
      });

      const nomeRemetente = m.sender.nome.trim().slice(0, 72);
      const titulo = `Nova mensagem de ${nomeRemetente}`.slice(0, 120);
      const preview = (bodyText || (attachmentName ? `📎 ${attachmentName}` : ""))
        .trim()
        .slice(0, 2000);

      for (const { userId: destUserId } of recipients) {
        await tx.notificacao.create({
          data: {
            schoolId,
            tipo: TipoNotificacao.NOVA_MENSAGEM_CHAT,
            titulo,
            mensagem: preview || "Nova mensagem.",
            entidadeTipo: EntidadeNotificacao.CHAT_THREAD,
            entidadeId: threadId,
            destinatarioUserId: destUserId,
          },
        });
      }

      await tx.schoolChatParticipant.updateMany({
        where: { threadId, userId: { not: user.id } },
        data: { hiddenAt: null },
      });

      return m;
    });

    return NextResponse.json(
      {
        ...mapSchoolChatMessageForViewer(
          {
            id: msg.id,
            body: msg.body,
            attachmentUrl: msg.attachmentUrl,
            attachmentName: msg.attachmentName,
            createdAt: msg.createdAt,
            editedAt: msg.editedAt,
            pinnedAt: msg.pinnedAt,
            deletedAt: msg.deletedAt,
            senderUserId: msg.senderUserId,
            sender: msg.sender,
          },
          user.id
        ),
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST school-chat messages:", e);
    return NextResponse.json({ error: "Erro ao enviar mensagem." }, { status: 500 });
  }
}
