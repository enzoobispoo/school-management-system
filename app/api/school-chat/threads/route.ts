import { NextRequest, NextResponse } from "next/server";
import { SchoolChatThreadKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";
import { blockProfessorWhenPortalDisabled } from "@/lib/docente/professor-portal-policy";
import { schoolChatDmKey } from "@/lib/school-chat/dm-key";
import { canCreateSchoolChatGroup } from "@/lib/school-chat/group-manager";
import { isSchoolChatPeerRole } from "@/lib/school-chat/peers";
import { viewerCanPostSchoolChat } from "@/lib/school-chat/write-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const userChatSelect = {
  id: true,
  nome: true,
  role: true,
  email: true,
  avatarUrl: true,
} as const;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const portalDeniedGet = await blockProfessorWhenPortalDisabled(user);
    if (portalDeniedGet) return portalDeniedGet;

    const filter = request.nextUrl.searchParams.get("filter")?.trim().toLowerCase();
    const kindFilter =
      filter === "direct" ? SchoolChatThreadKind.DIRECT
      : filter === "group" ? SchoolChatThreadKind.GROUP
      : null;

    const threads = await prisma.schoolChatThread.findMany({
      where: {
        schoolId,
        participants: {
          some: {
            userId: user.id,
            hiddenAt: null,
          },
        },
        ...(kindFilter ? { kind: kindFilter } : {}),
      },
      orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
      include: {
        participants: {
          select: {
            userId: true,
            pinnedAt: true,
            lastReadAt: true,
            user: { select: userChatSelect },
          },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            body: true,
            createdAt: true,
            senderUserId: true,
            attachmentName: true,
          },
        },
      },
    });

    threads.sort((a, b) => {
      const ap = a.participants.find((p) => p.userId === user.id)?.pinnedAt;
      const bp = b.participants.find((p) => p.userId === user.id)?.pinnedAt;
      const aPinned = ap ? 1 : 0;
      const bPinned = bp ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      const at = a.lastMessageAt?.getTime() ?? a.updatedAt.getTime();
      const bt = b.lastMessageAt?.getTime() ?? b.updatedAt.getTime();
      return bt - at;
    });

    const unreadByThreadId = new Map<string, number>();
    await Promise.all(
      threads.map(async (t) => {
        const myParticipant = t.participants.find((p) => p.userId === user.id);
        const lr = myParticipant?.lastReadAt ?? null;
        const c = await prisma.schoolChatMessage.count({
          where: {
            threadId: t.id,
            senderUserId: { not: user.id },
            deletedAt: null,
            ...(lr ? { createdAt: { gt: lr } } : {}),
          },
        });
        unreadByThreadId.set(t.id, Math.min(c, 99));
      })
    );

    const data = threads.map((t) => {
      const last = t.messages[0];
      const lastMessage = last
        ? {
            id: last.id,
            preview:
              last.body?.trim().slice(0, 160) ||
              (last.attachmentName ? `📎 ${last.attachmentName}` : ""),
            createdAt: last.createdAt.toISOString(),
            fromSelf: last.senderUserId === user.id,
          }
        : null;

      const viewerCanPost = viewerCanPostSchoolChat({
        kind: t.kind,
        writePolicy: t.writePolicy,
        ownerUserId: t.ownerUserId,
        viewerUserId: user.id,
      });

      const myParticipant = t.participants.find((p) => p.userId === user.id);
      const isPinned = Boolean(myParticipant?.pinnedAt);
      const unreadCount = unreadByThreadId.get(t.id) ?? 0;

      if (t.kind === SchoolChatThreadKind.GROUP) {
        return {
          id: t.id,
          kind: "group" as const,
          title: t.title,
          peer: null,
          participantCount: t.participants.length,
          writePolicy: t.writePolicy,
          ownerUserId: t.ownerUserId,
          viewerCanPost,
          isPinned,
          unreadCount,
          lastMessage,
          updatedAt: t.updatedAt.toISOString(),
        };
      }

      const peer =
        t.participants.map((p) => p.user).find((u) => u.id !== user.id) ??
        t.participants[0]?.user ??
        null;

      return {
        id: t.id,
        kind: "direct" as const,
        title: null,
        peer,
        participantCount: t.participants.length,
        writePolicy: t.writePolicy,
        ownerUserId: t.ownerUserId,
        viewerCanPost,
        isPinned,
        unreadCount,
        lastMessage,
        updatedAt: t.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      data,
      meta: {
        canCreateGroups: canCreateSchoolChatGroup(user.role),
      },
    });
  } catch (e) {
    console.error("GET school-chat/threads:", e);
    return NextResponse.json({ error: "Erro ao listar conversas." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const portalDeniedPost = await blockProfessorWhenPortalDisabled(user);
    if (portalDeniedPost) return portalDeniedPost;

    const body = await request.json().catch(() => ({}));

    const groupPayload = body?.group;
    if (groupPayload && typeof groupPayload === "object") {
      if (!canCreateSchoolChatGroup(user.role)) {
        return NextResponse.json(
          { error: "Apenas gestores podem criar grupos." },
          { status: 403 }
        );
      }

      const title = String(groupPayload.title ?? "").trim();
      if (title.length < 2 || title.length > 120) {
        return NextResponse.json(
          { error: "Nome do grupo entre 2 e 120 caracteres." },
          { status: 400 }
        );
      }

      const idsRaw = groupPayload.memberUserIds;
      if (!Array.isArray(idsRaw) || idsRaw.length === 0) {
        return NextResponse.json(
          { error: "Selecione pelo menos um participante." },
          { status: 400 }
        );
      }

      const writePolicyRaw = String(groupPayload.writePolicy ?? "ALL_MEMBERS");
      const writePolicy =
        writePolicyRaw === "OWNER_ONLY" ? "OWNER_ONLY" : "ALL_MEMBERS";

      const memberIds = [
        ...new Set(
          idsRaw
            .map((x: unknown) => String(x ?? "").trim())
            .filter(Boolean)
            .filter((id) => id !== user.id)
        ),
      ];

      if (memberIds.length === 0) {
        return NextResponse.json(
          { error: "Inclua pelo menos um participante além de você." },
          { status: 400 }
        );
      }

      const allIds = [user.id, ...memberIds];

      const validUsers = await prisma.user.findMany({
        where: {
          schoolId,
          ativo: true,
          id: { in: allIds },
        },
        select: { id: true, role: true },
      });

      if (validUsers.length !== allIds.length) {
        return NextResponse.json(
          { error: "Um ou mais participantes são inválidos para esta escola." },
          { status: 400 }
        );
      }

      for (const row of validUsers) {
        if (!isSchoolChatPeerRole(row.role)) {
          return NextResponse.json(
            { error: "Todos os participantes devem ser professores ou gestores da escola." },
            { status: 400 }
          );
        }
      }

      const thread = await prisma.schoolChatThread.create({
        data: {
          schoolId,
          kind: SchoolChatThreadKind.GROUP,
          dmKey: null,
          title,
          ownerUserId: user.id,
          writePolicy,
          participants: {
            create: allIds.map((uid) => ({ userId: uid })),
          },
        },
      });

      return NextResponse.json({
        threadId: thread.id,
        created: true,
        kind: "group",
      });
    }

    const peerUserId = String(body?.peerUserId || "").trim();
    if (!peerUserId || peerUserId === user.id) {
      return NextResponse.json({ error: "Destinatário inválido." }, { status: 400 });
    }

    const peer = await prisma.user.findFirst({
      where: {
        id: peerUserId,
        schoolId,
        ativo: true,
      },
      select: userChatSelect,
    });

    if (!peer || !isSchoolChatPeerRole(peer.role)) {
      return NextResponse.json(
        { error: "Você só pode conversar com usuários da mesma escola autorizados." },
        { status: 403 }
      );
    }

    const dmKey = schoolChatDmKey(user.id, peer.id);

    const existing = await prisma.schoolChatThread.findUnique({
      where: {
        schoolId_dmKey: { schoolId, dmKey },
      },
      include: {
        participants: {
          include: {
            user: { select: userChatSelect },
          },
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        threadId: existing.id,
        peer,
        created: false,
      });
    }

    const thread = await prisma.schoolChatThread.create({
      data: {
        schoolId,
        kind: SchoolChatThreadKind.DIRECT,
        dmKey,
        participants: {
          create: [{ userId: user.id }, { userId: peer.id }],
        },
      },
    });

    return NextResponse.json({
      threadId: thread.id,
      peer,
      created: true,
    });
  } catch (e) {
    console.error("POST school-chat/threads:", e);
    return NextResponse.json({ error: "Erro ao abrir conversa." }, { status: 500 });
  }
}
