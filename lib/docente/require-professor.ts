import { NextResponse } from "next/server";
import type { AuthenticatedUser } from "@/lib/auth/get-current-user";
import { blockProfessorWhenPortalDisabled } from "@/lib/docente/professor-portal-policy";

/** Escola + professor vinculado ou resposta de erro. */
export async function requireProfessorContext(
  user: AuthenticatedUser
): Promise<
  { schoolId: string; professorId: string } | NextResponse
> {
  if (user.role !== "PROFESSOR") {
    return NextResponse.json(
      { error: "Acesso restrito a professores." },
      { status: 403 }
    );
  }

  const portalDenied = await blockProfessorWhenPortalDisabled(user);
  if (portalDenied) return portalDenied;

  const schoolResult =
    user.schoolId ?
      { schoolId: user.schoolId }
    : null;
  if (!schoolResult) {
    return NextResponse.json({ error: "Escola não associada." }, { status: 403 });
  }
  if (!user.professorId) {
    return NextResponse.json(
      { error: "Conta não vinculada ao cadastro de professor." },
      { status: 403 }
    );
  }
  return { schoolId: schoolResult.schoolId, professorId: user.professorId };
}
