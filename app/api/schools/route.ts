import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lista escolas ativas (uso em convites / admin). */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    if (user.role === "ADMIN" && user.schoolId) {
      const school = await prisma.school.findFirst({
        where: { id: user.schoolId, ativo: true },
        select: { id: true, nome: true, slug: true },
      });
      return NextResponse.json({ schools: school ? [school] : [] });
    }

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const schools = await prisma.school.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, slug: true },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json({ schools });
  } catch (error) {
    console.error("Erro ao listar escolas:", error);
    return NextResponse.json({ error: "Erro ao listar escolas." }, { status: 500 });
  }
}
