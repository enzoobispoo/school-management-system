import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    let settings = await prisma.systemSetting.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: {
          id: "default",
        },
      });
    }

    return NextResponse.json({
      aiProviderMode: settings.aiProviderMode,
      openaiApiKey: settings.openaiApiKey,
      aiMonthlyLimit: settings.aiMonthlyLimit,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao carregar configurações da IA." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await request.json();

    const settings = await prisma.systemSetting.upsert({
      where: { id: "default" },
      update: {
        aiProviderMode: body.aiProviderMode,
        openaiApiKey: body.openaiApiKey || null,
        aiMonthlyLimit: body.aiMonthlyLimit,
      },
      create: {
        id: "default",
        aiProviderMode: body.aiProviderMode,
        openaiApiKey: body.openaiApiKey || null,
        aiMonthlyLimit: body.aiMonthlyLimit,
      },
    });

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(
      { error: "Erro ao salvar configurações da IA." },
      { status: 500 }
    );
  }
}