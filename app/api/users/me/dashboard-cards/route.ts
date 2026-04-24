import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";

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

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        dashboardCards: true,
        dashboardCardsOrder: true,
      },
    });

    return NextResponse.json({
      dashboardCards: dbUser?.dashboardCards ?? null,
      dashboardCardsOrder: dbUser?.dashboardCardsOrder ?? null,
    });
  } catch (error) {
    console.error("Erro ao buscar preferências do dashboard:", error);

    return NextResponse.json(
      { error: "Não foi possível carregar as preferências do dashboard." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { dashboardCards, dashboardCardsOrder } = body;

    if (!dashboardCards || typeof dashboardCards !== "object") {
      return NextResponse.json(
        { error: "dashboardCards inválido." },
        { status: 400 }
      );
    }

    if (
      dashboardCardsOrder &&
      !Array.isArray(dashboardCardsOrder)
    ) {
      return NextResponse.json(
        { error: "dashboardCardsOrder inválido." },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        dashboardCards,
        dashboardCardsOrder: dashboardCardsOrder ?? null,
      },
      select: {
        dashboardCards: true,
        dashboardCardsOrder: true,
      },
    });

    return NextResponse.json({
      message: "Preferências do dashboard salvas com sucesso.",
      dashboardCards: updatedUser.dashboardCards,
      dashboardCardsOrder: updatedUser.dashboardCardsOrder,
    });
  } catch (error) {
    console.error("Erro ao salvar preferências do dashboard:", error);

    return NextResponse.json(
      { error: "Não foi possível salvar as preferências do dashboard." },
      { status: 500 }
    );
  }
}