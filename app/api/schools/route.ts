import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { API_FORBIDDEN_PROFILE } from "@/lib/http/api-forbidden";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lista escolas ativas (uso em convites / admin). */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    if (user.schoolId) {
      const school = await prisma.school.findFirst({
        where: { id: user.schoolId, ativo: true },
        select: {
          id: true,
          nome: true,
          slug: true,
          escolaSettings: {
            select: { nomeEscola: true, logoUrl: true },
          },
        },
      });
      return NextResponse.json({
        schools: school
          ? [
              {
                id: school.id,
                nome: school.nome,
                slug: school.slug,
                nomeEscola:
                  school.escolaSettings?.nomeEscola ?? school.nome,
                logoUrl: school.escolaSettings?.logoUrl ?? null,
              },
            ]
          : [],
        role: user.role,
      });
    }

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: API_FORBIDDEN_PROFILE }, { status: 403 });
    }

    const schools = await prisma.school.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, slug: true },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json({ schools, role: user.role });
  } catch (error) {
    console.error("Erro ao listar escolas:", error);
    return NextResponse.json({ error: "Erro ao listar escolas." }, { status: 500 });
  }
}
