import { prisma } from "@/lib/prisma";

/** Assinaturas que liberam uso do plano. */
const ACTIVE_SUBSCRIPTION = ["ATIVA", "TRIAL"] as const;

/**
 * Limite de usuários do plano vigente da escola (`null` = ilimitado).
 * Usa assinatura ativa mais recente; se não houver, tenta `School.plano` → `Plan.slug`.
 */
export async function getSchoolPlanUserLimit(
  schoolId: string
): Promise<number | null> {
  const sub = await prisma.schoolSubscription.findFirst({
    where: { schoolId, status: { in: [...ACTIVE_SUBSCRIPTION] } },
    orderBy: { dataInicio: "desc" },
    select: { plan: { select: { limiteUsuarios: true } } },
  });
  if (sub?.plan?.limiteUsuarios != null) return sub.plan.limiteUsuarios;

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { plano: true },
  });
  if (!school?.plano) return null;

  const plan = await prisma.plan.findFirst({
    where: { slug: school.plano, ativo: true },
    select: { limiteUsuarios: true },
  });
  return plan?.limiteUsuarios ?? null;
}

export async function countActiveSchoolUsers(schoolId: string): Promise<number> {
  return prisma.user.count({
    where: { schoolId, ativo: true },
  });
}

/** Convites pendentes e ainda não expirados. */
export async function countPendingSchoolInvites(
  schoolId: string
): Promise<number> {
  const now = new Date();
  return prisma.userInvite.count({
    where: {
      schoolId,
      usedAt: null,
      expiresAt: { gt: now },
    },
  });
}

export type SchoolInviteQuota = {
  limiteUsuarios: number | null;
  activeUsers: number;
  pendingInvites: number;
  /** `null` quando o plano não limita usuários. */
  remaining: number | null;
};

export async function getSchoolInviteQuota(
  schoolId: string
): Promise<SchoolInviteQuota> {
  const [limiteUsuarios, activeUsers, pendingInvites] = await Promise.all([
    getSchoolPlanUserLimit(schoolId),
    countActiveSchoolUsers(schoolId),
    countPendingSchoolInvites(schoolId),
  ]);
  const remaining =
    limiteUsuarios == null ?
      null
    : Math.max(0, limiteUsuarios - activeUsers - pendingInvites);

  return { limiteUsuarios, activeUsers, pendingInvites, remaining };
}
