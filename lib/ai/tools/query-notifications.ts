import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildScopedNotificationWhere } from "@/lib/notificacoes/scoped-notification-where";

export async function queryNotifications(
  args: {
    unreadOnly?: boolean;
    limit?: number;
  },
  schoolId?: string | null,
  scope?: { role: string; professorId?: string | null; userId: string }
) {
  const sid = schoolId?.trim();
  const limit = Math.min(Math.max(Number(args.limit) || 12, 1), 40);
  if (!sid) {
    return { error: "school_missing", naoLidas: 0, itens: [] as unknown[] };
  }

  if (!scope?.userId) {
    return {
      error: "user_scope_missing",
      naoLidas: 0,
      itens: [] as unknown[],
    };
  }

  const scopedWhere: Prisma.NotificacaoWhereInput =
    await buildScopedNotificationWhere({
      schoolId: sid,
      role: scope.role,
      professorId: scope.professorId ?? null,
      userId: scope.userId,
    });

  const unreadFilter: Prisma.NotificacaoWhereInput =
    args.unreadOnly !== false ? { lida: false } : {};

  const where: Prisma.NotificacaoWhereInput = {
    AND: [scopedWhere, unreadFilter],
  };

  const countUnreadWhere: Prisma.NotificacaoWhereInput = {
    AND: [scopedWhere, { lida: false }],
  };

  const [naoLidas, itens] = await Promise.all([
    prisma.notificacao.count({
      where: countUnreadWhere,
    }),
    prisma.notificacao.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        titulo: true,
        tipo: true,
        lida: true,
        createdAt: true,
        mensagem: true,
      },
    }),
  ]);

  return {
    naoLidas,
    filtro: args.unreadOnly === false ? "todas" : "nao_lidas",
    itens: itens.map((n) => ({
      id: n.id,
      titulo: n.titulo,
      tipo: n.tipo,
      lida: n.lida,
      createdAt: n.createdAt.toISOString(),
      mensagemPreview: n.mensagem.slice(0, 280),
    })),
  };
}
