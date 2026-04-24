import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_FREQUENCIES = ["daily", "weekly", "biweekly", "monthly"] as const;

type InsightFrequency = (typeof ALLOWED_FREQUENCIES)[number];

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        dashboardInsightsFrequency: true,
        dashboardInsightsDismissed: true,
        dashboardInsightsEnabled: true,
        dashboardInsightsLimit: true,
      },
    });

    return NextResponse.json({
      frequency: dbUser?.dashboardInsightsFrequency ?? "weekly",
      dismissed: dbUser?.dashboardInsightsDismissed ?? {},
      enabled: dbUser?.dashboardInsightsEnabled ?? true,
      limit: dbUser?.dashboardInsightsLimit ?? 3,
    });
  } catch (error) {
    console.error("Erro ao buscar preferências dos insights:", error);

    return NextResponse.json(
      { error: "Não foi possível carregar as preferências dos insights." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await request.json();
    const {
      frequency,
      enabled,
      limit,
    }: {
      frequency?: InsightFrequency;
      enabled?: boolean;
      limit?: number;
    } = body;

    if (frequency !== undefined && !ALLOWED_FREQUENCIES.includes(frequency)) {
      return NextResponse.json(
        { error: "Frequência inválida." },
        { status: 400 }
      );
    }

    if (enabled !== undefined && typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled inválido." },
        { status: 400 }
      );
    }

    if (
      limit !== undefined &&
      (!Number.isInteger(limit) || limit < 1 || limit > 10)
    ) {
      return NextResponse.json(
        { error: "limit inválido." },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(frequency !== undefined
          ? { dashboardInsightsFrequency: frequency }
          : {}),
        ...(enabled !== undefined
          ? { dashboardInsightsEnabled: enabled }
          : {}),
        ...(limit !== undefined ? { dashboardInsightsLimit: limit } : {}),
      },
      select: {
        dashboardInsightsFrequency: true,
        dashboardInsightsDismissed: true,
        dashboardInsightsEnabled: true,
        dashboardInsightsLimit: true,
      },
    });

    return NextResponse.json({
      frequency: updatedUser.dashboardInsightsFrequency ?? "weekly",
      dismissed: updatedUser.dashboardInsightsDismissed ?? {},
      enabled: updatedUser.dashboardInsightsEnabled ?? true,
      limit: updatedUser.dashboardInsightsLimit ?? 3,
    });
  } catch (error) {
    console.error("Erro ao salvar configurações dos insights:", error);

    return NextResponse.json(
      { error: "Não foi possível salvar as configurações dos insights." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await request.json();
    const { insightId, reset } = body as {
      insightId?: string;
      reset?: boolean;
    };

    if (reset) {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          dashboardInsightsDismissed: {},
        },
        select: {
          dashboardInsightsFrequency: true,
          dashboardInsightsDismissed: true,
          dashboardInsightsEnabled: true,
          dashboardInsightsLimit: true,
        },
      });

      return NextResponse.json({
        frequency: updatedUser.dashboardInsightsFrequency ?? "weekly",
        dismissed: updatedUser.dashboardInsightsDismissed ?? {},
        enabled: updatedUser.dashboardInsightsEnabled ?? true,
        limit: updatedUser.dashboardInsightsLimit ?? 3,
      });
    }

    if (!insightId) {
      return NextResponse.json(
        { error: "insightId é obrigatório." },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        dashboardInsightsDismissed: true,
      },
    });

    const dismissed =
      currentUser?.dashboardInsightsDismissed &&
      typeof currentUser.dashboardInsightsDismissed === "object"
        ? (currentUser.dashboardInsightsDismissed as Record<string, string>)
        : {};

    const nextDismissed = {
      ...dismissed,
      [insightId]: new Date().toISOString(),
    };

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        dashboardInsightsDismissed: nextDismissed,
      },
      select: {
        dashboardInsightsFrequency: true,
        dashboardInsightsDismissed: true,
        dashboardInsightsEnabled: true,
        dashboardInsightsLimit: true,
      },
    });

    return NextResponse.json({
      frequency: updatedUser.dashboardInsightsFrequency ?? "weekly",
      dismissed: updatedUser.dashboardInsightsDismissed ?? {},
      enabled: updatedUser.dashboardInsightsEnabled ?? true,
      limit: updatedUser.dashboardInsightsLimit ?? 3,
    });
  } catch (error) {
    console.error("Erro ao atualizar insights:", error);

    return NextResponse.json(
      { error: "Não foi possível atualizar os insights." },
      { status: 500 }
    );
  }
}