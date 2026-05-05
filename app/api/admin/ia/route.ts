import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { AiProviderMode } from "@prisma/client";
import { maskApiKey, ensureCurrentAiUsageWindow, getOrCreateSystemSetting } from "@/lib/ia/system-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const settings = await ensureCurrentAiUsageWindow(await getOrCreateSystemSetting());

  return NextResponse.json({
    aiProviderMode: settings.aiProviderMode,
    hasCustomKey: Boolean(settings.openaiApiKey?.trim()),
    maskedCustomKey: maskApiKey(settings.openaiApiKey),
    aiMonthlyLimit: settings.aiMonthlyLimit,
    aiUsageCount: settings.aiUsageCount,
    aiUsageResetAt: settings.aiUsageResetAt,
    hasPlatformKey: Boolean(process.env.OPENAI_API_KEY?.trim()),
  });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const body = await request.json();
  const mode = body?.aiProviderMode === "CUSTOM" ? AiProviderMode.CUSTOM : AiProviderMode.PLATFORM;
  const limit = Number.isFinite(Number(body?.aiMonthlyLimit)) && Number(body.aiMonthlyLimit) > 0
    ? Math.floor(Number(body.aiMonthlyLimit)) : 1000;

  const existing = await getOrCreateSystemSetting();
  const hasKeyField = body && typeof body === "object" && "openaiApiKey" in body;
  const keyTrimmed = typeof body?.openaiApiKey === "string" ? body.openaiApiKey.trim() : "";
  const nextKey = hasKeyField ? (keyTrimmed || null) : existing.openaiApiKey;

  if (mode === AiProviderMode.CUSTOM && !nextKey?.trim()) {
    return NextResponse.json({ error: "Informe uma OPENAI_API_KEY válida para o modo custom." }, { status: 400 });
  }

  const updated = await prisma.systemSetting.upsert({
    where: { id: "default" },
    update: { aiProviderMode: mode, openaiApiKey: nextKey, aiMonthlyLimit: limit },
    create: { id: "default", aiProviderMode: mode, openaiApiKey: nextKey, aiMonthlyLimit: limit },
  });

  return NextResponse.json({
    success: true,
    aiProviderMode: updated.aiProviderMode,
    hasCustomKey: Boolean(updated.openaiApiKey?.trim()),
    maskedCustomKey: maskApiKey(updated.openaiApiKey),
    aiMonthlyLimit: updated.aiMonthlyLimit,
    aiUsageCount: updated.aiUsageCount,
  });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
  // Reset usage counter
  await prisma.systemSetting.update({
    where: { id: "default" },
    data: { aiUsageCount: 0, aiUsageResetAt: new Date() },
  });
  return NextResponse.json({ success: true });
}
