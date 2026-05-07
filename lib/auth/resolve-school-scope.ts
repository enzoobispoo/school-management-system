import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { AuthenticatedUser } from "@/lib/auth/get-current-user";

/**
 * Resolve tenant para APIs escoladas. Usuários com `schoolId` fixo sempre usam a própria escola.
 * SUPER_ADMIN sem escola deve enviar `?schoolId=` na URL.
 */
export async function resolveSchoolScopeForRequest(
  user: AuthenticatedUser | null,
  request: NextRequest
): Promise<{ schoolId: string } | NextResponse> {
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const paramSchoolId = request.nextUrl.searchParams.get("schoolId")?.trim();

  if (user.schoolId) {
    if (
      paramSchoolId &&
      paramSchoolId !== user.schoolId &&
      user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Parâmetro schoolId não permitido para este usuário." },
        { status: 403 }
      );
    }
    return { schoolId: user.schoolId };
  }

  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Escola não associada." }, { status: 403 });
  }

  if (!paramSchoolId) {
    return NextResponse.json(
      {
        error:
          "Para SUPER_ADMIN, informe schoolId na URL (ex.: ?schoolId=...) para escolher a escola.",
      },
      { status: 400 }
    );
  }

  const school = await prisma.school.findFirst({
    where: { id: paramSchoolId, ativo: true },
    select: { id: true },
  });
  if (!school) {
    return NextResponse.json(
      { error: "Escola não encontrada ou inativa." },
      { status: 404 }
    );
  }

  return { schoolId: school.id };
}
