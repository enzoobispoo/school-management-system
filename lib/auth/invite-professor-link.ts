import type { Prisma } from "@prisma/client";

/**
 * Ao ativar convite com perfil PROFESSOR, associa o User ao cadastro de Professor
 * quando o e-mail do convite coincide com o e-mail do professor na mesma escola
 * e o professor ainda não está vinculado a outro usuário.
 */
export async function resolveProfessorIdForProfessorInvite(
  tx: Prisma.TransactionClient,
  params: {
    schoolId: string | null;
    role: string;
    email: string;
    excludeUserId?: string | null;
  }
): Promise<string | undefined> {
  if (params.role !== "PROFESSOR" || !params.schoolId) {
    return undefined;
  }

  const email = params.email.trim().toLowerCase();

  const professor = await tx.professor.findFirst({
    where: {
      schoolId: params.schoolId,
      email: { equals: email, mode: "insensitive" },
      ativo: true,
    },
    select: { id: true },
  });

  if (!professor) {
    return undefined;
  }

  const taken = await tx.user.findFirst({
    where: { professorId: professor.id },
    select: { id: true },
  });

  if (taken && taken.id !== params.excludeUserId) {
    return undefined;
  }

  return professor.id;
}
