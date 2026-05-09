import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuditDomain = "finance" | "enrollment";

/** Perfis que podem consultar o extrato (filtrado por domínio na própria rota). */
function auditDomainScope(role: string): AuditDomain[] | "all" {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "all";
  if (role === "FINANCEIRO") return ["finance"];
  if (role === "SECRETARIA" || role === "SECRETARIA_FINANCEIRA") {
    return ["enrollment"];
  }
  return [];
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const scope = auditDomainScope(user.role);
    if (scope !== "all" && scope.length === 0) {
      return NextResponse.json(
        {
          error:
            "Este extrato de auditoria não está disponível para o seu perfil.",
          code: "FORBIDDEN_AUDIT_READ",
        },
        { status: 403 }
      );
    }

    const school = requireSchool(user);
    if (school instanceof NextResponse) return school;
    const { schoolId } = school;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || "40"), 1), 100);
    const domainParam = searchParams.get("domain")?.trim();

    const where: Prisma.SchoolAuditLogWhereInput = { schoolId };

    if (scope === "all") {
      if (domainParam === "finance" || domainParam === "enrollment") {
        where.domain = domainParam;
      }
    } else {
      where.domain = { in: scope };
    }

    const rows = await prisma.schoolAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        domain: true,
        action: true,
        resourceId: true,
        summary: true,
        role: true,
        payload: true,
        user: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Erro ao listar auditoria:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o extrato." },
      { status: 500 }
    );
  }
}
