import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { AuthenticatedUser } from "@/lib/auth/get-current-user";

const MSG =
  "O portal do professor está desativado para esta escola. Em caso de dúvida, fale com a secretaria.";

export async function isProfessorPortalEnabledForSchool(
  schoolId: string
): Promise<boolean> {
  const row = await prisma.escolaSettings.findUnique({
    where: { schoolId },
    select: { professorPortalEnabled: true },
  });
  return row?.professorPortalEnabled ?? true;
}

/** Bloqueia apenas usuários PROFESSOR quando a escola desligou o portal. */
export async function blockProfessorWhenPortalDisabled(
  user: Pick<AuthenticatedUser, "role" | "schoolId">
): Promise<NextResponse | null> {
  if (user.role !== "PROFESSOR" || !user.schoolId) return null;
  const ok = await isProfessorPortalEnabledForSchool(user.schoolId);
  if (ok) return null;
  return NextResponse.json(
    {
      error: MSG,
      code: "PROFESSOR_PORTAL_DISABLED",
    },
    { status: 403 }
  );
}
