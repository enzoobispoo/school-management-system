import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin, resolveSchoolScopeForRequest } from "@/lib/auth";
import type { IncidentCategory, IncidentSeverity, IncidentStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const schoolGate = await resolveSchoolScopeForRequest(user, request);
    if (schoolGate instanceof NextResponse) return schoolGate;
    const { schoolId } = schoolGate;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim() as IncidentStatus | undefined;
    const category = searchParams.get("category")?.trim() as IncidentCategory | undefined;
    const severity = searchParams.get("severity")?.trim() as IncidentSeverity | undefined;
    const page = Math.max(Number(searchParams.get("page") || "1"), 1);
    const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") || "20"), 1), 100);

    const where = {
      schoolId,
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
      ...(severity ? { severity } : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.operationalIncident.count({ where }),
      prisma.operationalIncident.findMany({
        where,
        orderBy: [{ severity: "desc" }, { lastDetectedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const data = rows.map((r) => ({
      ...r,
      suggestedActions: r.suggestedActions as unknown as string[],
      lastDetectedAt: r.lastDetectedAt.toISOString(),
      lastNotifiedAt: r.lastNotifiedAt?.toISOString() ?? null,
      acknowledgedAt: r.acknowledgedAt?.toISOString() ?? null,
      resolvedAt: r.resolvedAt?.toISOString() ?? null,
      dismissedAt: r.dismissedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || (total > 0 ? 1 : 0),
        canDismissIncidents: isAdmin(user),
      },
    });
  } catch (error) {
    console.error("Erro ao listar incidentes:", error);
    return NextResponse.json(
      { error: "Erro ao listar incidentes operacionais." },
      { status: 500 }
    );
  }
}
