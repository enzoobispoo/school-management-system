import { prisma } from "@/lib/prisma";
import { resolveProfessorIdForProfessorInvite } from "@/lib/auth/invite-professor-link";

export type SyncProfessorLinkResult =
  | { ok: true; professorId: string }
  | {
      ok: false;
      reason:
        | "not_professor"
        | "already_linked"
        | "missing_school_or_email"
        | "no_professor_match";
    };

/**
 * Associa retroativamente `User.professorId` quando existe professor ativo na mesma escola
 * com o mesmo e-mail do usuário (mesma regra do convite).
 */
export async function tryLinkProfessorUser(userId: string): Promise<SyncProfessorLinkResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      schoolId: true,
      email: true,
      professorId: true,
    },
  });

  if (!user || user.role !== "PROFESSOR") {
    return { ok: false, reason: "not_professor" };
  }
  if (user.professorId) {
    return { ok: false, reason: "already_linked" };
  }
  if (!user.schoolId || !user.email?.trim()) {
    return { ok: false, reason: "missing_school_or_email" };
  }

  return prisma.$transaction(async (tx) => {
    const professorId = await resolveProfessorIdForProfessorInvite(tx, {
      schoolId: user.schoolId,
      role: "PROFESSOR",
      email: user.email,
      excludeUserId: user.id,
    });

    if (!professorId) {
      return { ok: false as const, reason: "no_professor_match" as const };
    }

    await tx.user.update({
      where: { id: userId },
      data: { professorId },
    });

    return { ok: true as const, professorId };
  });
}
