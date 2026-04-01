import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PersistedMessage = {
  role: "user" | "assistant";
  content: string;
  meta?: {
    intent?: string;
    confidence?: number;
    executed?: boolean;
  };
};

function normalizeMessages(input: unknown): PersistedMessage[] {
  if (!Array.isArray(input)) return [];

  const normalized = input
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const message = item as {
        role?: unknown;
        content?: unknown;
        meta?: {
          intent?: unknown;
          confidence?: unknown;
          executed?: unknown;
        };
      };

      if (message.role !== "user" && message.role !== "assistant") {
        return null;
      }

      if (typeof message.content !== "string" || !message.content.trim()) {
        return null;
      }

      return {
        role: message.role,
        content: message.content.trim(),
        meta: {
          intent:
            typeof message.meta?.intent === "string"
              ? message.meta.intent
              : undefined,
          confidence:
            typeof message.meta?.confidence === "number"
              ? message.meta.confidence
              : undefined,
          executed:
            typeof message.meta?.executed === "boolean"
              ? message.meta.executed
              : undefined,
        },
      } as PersistedMessage;
    })
    .filter((message): message is PersistedMessage => message !== null);

  return normalized;
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const session = await prisma.aiChatSession.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({
      session: session
        ? {
            id: session.id,
            title: session.title,
            messages: session.messages.map((message) => ({
              id: message.id,
              role: message.role as "user" | "assistant",
              content: message.content,
              meta: {
                intent: message.intent ?? undefined,
                confidence: message.confidence ?? undefined,
                executed: message.executed,
              },
            })),
          }
        : null,
    });
  } catch (error) {
    console.error("Erro ao buscar histórico da EduIA:", error);

    return NextResponse.json(
      { error: "Não foi possível carregar o histórico da EduIA." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const messages = normalizeMessages(body?.messages);
    const title =
      typeof body?.title === "string" && body.title.trim()
        ? body.title.trim()
        : "Conversa EduIA";

    const existingSession = await prisma.aiChatSession.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });

    let sessionId = existingSession?.id;

    if (!sessionId) {
      const createdSession = await prisma.aiChatSession.create({
        data: {
          userId: user.id,
          title,
        },
        select: { id: true },
      });

      sessionId = createdSession.id;
    }

    await prisma.$transaction(async (tx) => {
      await tx.aiChatSession.update({
        where: { id: sessionId },
        data: { title },
      });

      await tx.aiChatMessage.deleteMany({
        where: { sessionId },
      });

      if (messages.length > 0) {
        await tx.aiChatMessage.createMany({
          data: messages.map((message: PersistedMessage) => ({
            sessionId,
            role: message.role,
            content: message.content,
            intent: message.meta?.intent ?? null,
            confidence:
              typeof message.meta?.confidence === "number"
                ? message.meta.confidence
                : null,
            executed: message.meta?.executed ?? false,
          })),
        });
      }
    });

    return NextResponse.json({
      success: true,
      sessionId,
    });
  } catch (error) {
    console.error("Erro ao salvar histórico da EduIA:", error);

    return NextResponse.json(
      { error: "Não foi possível salvar o histórico da EduIA." },
      { status: 500 }
    );
  }
}