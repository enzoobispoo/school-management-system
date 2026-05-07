import { prisma } from "@/lib/prisma";

/** Marca uma notificação da escola como lida (baixo risco; não exige segunda confirmação). */
export async function markNotificationReadTool(
  args: { notificationId?: string },
  schoolId?: string | null
) {
  const sid = schoolId?.trim();
  const nid = args.notificationId?.trim();

  if (!sid) {
    return { ok: false, error: "school_missing" };
  }
  if (!nid) {
    return { ok: false, error: "missing_notification_id" };
  }

  const existing = await prisma.notificacao.findFirst({
    where: { id: nid, schoolId: sid },
    select: { id: true, lida: true, titulo: true },
  });

  if (!existing) {
    return { ok: false, error: "not_found" };
  }

  if (existing.lida) {
    return {
      ok: true,
      notificationId: nid,
      alreadyRead: true,
      titulo: existing.titulo,
    };
  }

  await prisma.notificacao.update({
    where: { id: nid },
    data: { lida: true },
  });

  return {
    ok: true,
    notificationId: nid,
    titulo: existing.titulo,
    message: "Notificação marcada como lida.",
  };
}
