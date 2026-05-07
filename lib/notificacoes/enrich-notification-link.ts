import type { Notificacao } from "@prisma/client";
import { TipoNotificacao } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notificationLinkHref } from "@/lib/notificacoes/notification-link-href";

export type NotificacaoComLink = Notificacao & { linkHref: string | null };

export async function enrichNotificationsWithLinkHref(
  notificacoes: Notificacao[],
  schoolId: string
): Promise<NotificacaoComLink[]> {
  const matriculaIds = [
    ...new Set(
      notificacoes
        .filter((n) => n.entidadeTipo === "MATRICULA" && n.entidadeId)
        .map((n) => n.entidadeId!)
    ),
  ];

  let matriculaIdToAlunoId = new Map<string, string>();
  if (matriculaIds.length > 0) {
    const matRows = await prisma.matricula.findMany({
      where: { schoolId, id: { in: matriculaIds } },
      select: { id: true, alunoId: true },
    });
    matriculaIdToAlunoId = new Map(matRows.map((r) => [r.id, r.alunoId]));
  }

  return notificacoes.map((n) => {
    const trocaHref =
      n.tipo === TipoNotificacao.TROCA_PROFESSOR_SOLICITADA && n.entidadeId
        ? `/docente/trocas?proposta=${encodeURIComponent(n.entidadeId)}`
        : null;

    return {
      ...n,
      linkHref:
        trocaHref ??
        notificationLinkHref(
          n.entidadeTipo,
          n.entidadeId,
          matriculaIdToAlunoId
        ),
    };
  });
}

export async function enrichNotificationWithLinkHref(
  notificacao: Notificacao,
  schoolId: string
): Promise<NotificacaoComLink> {
  const [one] = await enrichNotificationsWithLinkHref([notificacao], schoolId);
  return one;
}
