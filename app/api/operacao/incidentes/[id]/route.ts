import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin, resolveSchoolScopeForRequest } from "@/lib/auth";
import { patchOperationalIncidentSchema } from "@/lib/validations/operacao-incident";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const schoolGate = await resolveSchoolScopeForRequest(user, request);
    if (schoolGate instanceof NextResponse) return schoolGate;
    const { schoolId } = schoolGate;

    const { id } = await context.params;
    const body = await request.json();
    const parsed = patchOperationalIncidentSchema.safeParse(body);
    if (!parsed.success) {
      const err = parsed.error.flatten().fieldErrors;
      const first = Object.values(err).flat()[0];
      return NextResponse.json(
        { error: first || "Dados inválidos", details: err },
        { status: 400 }
      );
    }

    const incident = await prisma.operationalIncident.findFirst({
      where: { id, schoolId },
    });

    if (!incident) {
      return NextResponse.json({ error: "Incidente não encontrado." }, { status: 404 });
    }

    const now = new Date();
    const userId = user.id;

    let data: Parameters<typeof prisma.operationalIncident.update>[0]["data"];

    if (parsed.data.action === "dismiss" && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Apenas administradores podem dispensar incidentes." },
        { status: 403 }
      );
    }

    switch (parsed.data.action) {
      case "acknowledge":
        data = {
          status: "ACKNOWLEDGED",
          acknowledgedAt: now,
          acknowledgedById: userId,
        };
        break;
      case "resolve":
        data = {
          status: "RESOLVED",
          resolvedAt: now,
          resolvedById: userId,
        };
        break;
      case "dismiss":
        data = {
          status: "DISMISSED",
          dismissedAt: now,
          dismissedById: userId,
          dismissReason: parsed.data.dismissReason!.trim(),
        };
        break;
      default:
        data = {};
    }

    const updated = await prisma.operationalIncident.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      acknowledgedAt: updated.acknowledgedAt?.toISOString() ?? null,
      resolvedAt: updated.resolvedAt?.toISOString() ?? null,
      dismissedAt: updated.dismissedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Erro ao atualizar incidente:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar incidente." },
      { status: 500 }
    );
  }
}
