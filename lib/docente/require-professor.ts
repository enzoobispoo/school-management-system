import { NextResponse } from "next/server";
import type { AuthenticatedUser } from "@/lib/auth/get-current-user";

/** Escola + professor vinculado ou resposta de erro. */
export function requireProfessorContext(user: AuthenticatedUser): {
  schoolId: string;
  professorId: string;
} | NextResponse {
  if (user.role !== "PROFESSOR") {
    return NextResponse.json({ error: "Acesso restrito a professores." }, { status: 403 });
  }
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
