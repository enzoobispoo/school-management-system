import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { eduiaClientCapsFromResolvedSchoolAi } from "@/lib/ai/eduia-client-caps";
import { resolveSchoolAiForUser } from "@/lib/ai/resolve-school-ai";
import { isProfessorPortalEnabledForSchool } from "@/lib/docente/professor-portal-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    let professorPortalEnabled: boolean | undefined;
    if (user.role === "PROFESSOR" && user.schoolId) {
      professorPortalEnabled = await isProfessorPortalEnabledForSchool(
        user.schoolId
      );
    }

    const eduiaCaps =
      user.schoolId ?
        eduiaClientCapsFromResolvedSchoolAi(
          await resolveSchoolAiForUser({ schoolId: user.schoolId })
        )
      : null;

    return NextResponse.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        ativo: user.ativo,
        professorId: user.professorId ?? null,
        avatarUrl: user.avatarUrl ?? null,
      },
      eduiaCaps,
      ...(typeof professorPortalEnabled === "boolean" ?
        { professorPortalEnabled }
      : {}),
    });
  } catch (error) {
    console.error("Erro ao buscar usuário autenticado:", error);

    return NextResponse.json(
      { error: "Não foi possível carregar o usuário." },
      { status: 500 }
    );
  }
}