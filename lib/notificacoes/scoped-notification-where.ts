import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notificacaoWhereForUser } from "@/lib/notificacoes/scope-for-user";

/**
 * Escopo completo de notificações (inclui exclusões extras para professor,
 * ex.: incidentes operacionais da categoria FINANCE).
 */
export async function buildScopedNotificationWhere(params: {
  schoolId: string;
  role: string;
  professorId?: string | null;
  userId: string;
}): Promise<Prisma.NotificacaoWhereInput> {
  const base = notificacaoWhereForUser(params);

  if (params.role !== "PROFESSOR") {
    return base;
  }

  const financeIncidents = await prisma.operationalIncident.findMany({
    where: { schoolId: params.schoolId, category: "FINANCE" },
    select: { id: true },
  });
  const ids = financeIncidents.map((i) => i.id);
  if (!ids.length) {
    return base;
  }

  return {
    AND: [
      base,
      {
        NOT: {
          AND: [
            { tipo: "SISTEMA" },
            { entidadeTipo: "SISTEMA" },
            { entidadeId: { in: ids } },
          ],
        },
      },
    ],
  };
}
