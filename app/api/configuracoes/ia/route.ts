import { NextRequest, NextResponse } from "next/server";
import { AiProviderMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ensureCurrentAiUsageWindow,
  getOrCreateSystemSetting,
  maskApiKey,
} from "@/lib/ia/system-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await ensureCurrentAiUsageWindow(
      await getOrCreateSystemSetting()
    );

    return NextResponse.json({
      aiProviderMode: settings.aiProviderMode,
      hasCustomKey: Boolean(settings.openaiApiKey?.trim()),
      maskedCustomKey: maskApiKey(settings.openaiApiKey),
      aiMonthlyLimit: settings.aiMonthlyLimit,
      aiUsageCount: settings.aiUsageCount,
      aiUsageResetAt: settings.aiUsageResetAt,
      hasPlatformKey: Boolean(process.env.OPENAI_API_KEY?.trim()),
    });
  } catch (error) {
    console.error("Erro ao buscar configurações de IA:", error);

    return NextResponse.json(
      { error: "Não foi possível carregar as configurações de IA." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const aiProviderMode =
      body?.aiProviderMode === "CUSTOM"
        ? AiProviderMode.CUSTOM
        : AiProviderMode.PLATFORM;

    const openaiApiKey =
      typeof body?.openaiApiKey === "string"
        ? body.openaiApiKey.trim()
        : "";

    const aiMonthlyLimitRaw = Number(body?.aiMonthlyLimit);
    const aiMonthlyLimit =
      Number.isFinite(aiMonthlyLimitRaw) && aiMonthlyLimitRaw > 0
        ? Math.floor(aiMonthlyLimitRaw)
        : 1000;

    if (aiProviderMode === AiProviderMode.CUSTOM && !openaiApiKey) {
      return NextResponse.json(
        {
          error:
            "Para usar o modo de chave própria, informe uma OPENAI_API_KEY válida.",
        },
        { status: 400 }
      );
    }

    const updated = await prisma.systemSetting.upsert({
      where: { id: "default" },
      update: {
        aiProviderMode,
        openaiApiKey: openaiApiKey || null,
        aiMonthlyLimit,
      },
      create: {
        id: "default",
        aiProviderMode,
        openaiApiKey: openaiApiKey || null,
        aiMonthlyLimit,
      },
    });

    return NextResponse.json({
      success: true,
      aiProviderMode: updated.aiProviderMode,
      hasCustomKey: Boolean(updated.openaiApiKey?.trim()),
      maskedCustomKey: maskApiKey(updated.openaiApiKey),
      aiMonthlyLimit: updated.aiMonthlyLimit,
      aiUsageCount: updated.aiUsageCount,
      aiUsageResetAt: updated.aiUsageResetAt,
    });
  } catch (error) {
    console.error("Erro ao salvar configurações de IA:", error);

    return NextResponse.json(
      { error: "Não foi possível salvar as configurações de IA." },
      { status: 500 }
    );
  }
}