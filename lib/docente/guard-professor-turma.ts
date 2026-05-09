import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { AuthenticatedUser } from "@/lib/auth/get-current-user";
import { blockProfessorWhenPortalDisabled } from "@/lib/docente/professor-portal-policy";

/** Garante professor titular da turma na escola. `null` = autorizado. */
export async function guardProfessorTitularTurma(
  user: AuthenticatedUser,
  schoolId: string,
  turmaId: string
): Promise<NextResponse | null> {
  if (user.role !== "PROFESSOR") {
    return NextResponse.json(
      { error: "Acesso restrito a professores." },
      { status: 403 }
    );
  }

  const portalDenied = await blockProfessorWhenPortalDisabled(user);
  if (portalDenied) return portalDenied;

  if (!user.professorId) {
    return NextResponse.json(
      { error: "Conta não vinculada ao cadastro de professor." },
      { status: 403 }
    );
  }

  const turma = await prisma.turma.findFirst({
    where: {
      id: turmaId,
      schoolId,
      professorId: user.professorId,
      ativo: true,
    },
    select: { id: true },
  });

  if (!turma) {
    return NextResponse.json(
      {
        error: "Turma não encontrada ou você não é o professor titular.",
      },
      { status: 404 }
    );
  }

  return null;
}
