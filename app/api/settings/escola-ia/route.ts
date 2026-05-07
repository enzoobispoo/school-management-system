import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";
import { maskApiKey } from "@/lib/ia/system-settings";
import { ensureSchoolAiUsageWindow } from "@/lib/ai/school-ai-settings";
import {
  effectiveAiMonthlyLimit,
  normalizePlanTier,
  planAllowsCustomTwilio,
  planAllowsOpenAi,
  planDefaultAiMonthlyLimit,
} from "@/lib/school-plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function maskTwilioToken(t: string | null | undefined) {
  if (!t?.trim()) return null;
  const s = t.trim();
  if (s.length <= 6) return "••••••";
  return `${s.slice(0, 3)}••••${s.slice(-2)}`;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const result = requireSchool(user);
    if (result instanceof NextResponse) return result;
    const { schoolId } = result;

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { plano: true, escolaSettings: true },
    });
    if (!school) return NextResponse.json({ error: "Escola não encontrada." }, { status: 404 });

    let settings = school.escolaSettings;
    if (!settings) {
      settings = await prisma.escolaSettings.create({
        data: { id: schoolId, schoolId, nomeEscola: "Minha Escola" },
      });
    }

    const usageRow = await ensureSchoolAiUsageWindow(schoolId, {
      aiUsageCount: settings.aiUsageCount,
      aiUsageResetAt: settings.aiUsageResetAt,
    });

    const tier = normalizePlanTier(school.plano);
    const monthlyLimit = effectiveAiMonthlyLimit(tier, settings.aiMonthlyLimitOverride);

    return NextResponse.json({
      planTier: tier,
      allowOpenAi: planAllowsOpenAi(tier),
      allowCustomTwilio: planAllowsCustomTwilio(tier),
      planDefaultAiMonthlyLimit: planDefaultAiMonthlyLimit(tier),
      aiMonthlyLimit: monthlyLimit,
      aiMonthlyLimitOverride: settings.aiMonthlyLimitOverride,
      aiUsageCount: usageRow?.aiUsageCount ?? settings.aiUsageCount,
      aiUsageResetAt: usageRow?.aiUsageResetAt ?? settings.aiUsageResetAt,
      hasOpenaiApiKey: Boolean(settings.openaiApiKey?.trim()),
      maskedOpenaiApiKey: maskApiKey(settings.openaiApiKey),
      twilioAccountSid: settings.twilioAccountSid?.trim() || null,
      hasTwilioAuthToken: Boolean(settings.twilioAuthToken?.trim()),
      maskedTwilioAuthToken: maskTwilioToken(settings.twilioAuthToken),
      twilioWhatsAppFrom: settings.twilioWhatsAppFrom?.trim() || null,
      aiEvalReviewEnforced: settings.aiEvalReviewEnforced,
      aiEvalReviewMinScore: settings.aiEvalReviewMinScore,
    });
  } catch (e) {
    console.error("escola-ia GET", e);
    return NextResponse.json({ error: "Erro ao carregar integrações." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Apenas administradores podem alterar." }, { status: 403 });
    }
    const result = requireSchool(user);
    if (result instanceof NextResponse) return result;
    const { schoolId } = result;

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { plano: true, escolaSettings: true },
    });
    if (!school?.escolaSettings) {
      return NextResponse.json({ error: "Configurações da escola não encontradas." }, { status: 404 });
    }

    const tier = normalizePlanTier(school.plano);
    const body = await request.json() as Record<string, unknown>;

    const data: Record<string, unknown> = {};

    if (planAllowsOpenAi(tier)) {
      if ("openaiApiKey" in body) {
        const k = body.openaiApiKey;
        if (k === null || k === "") data.openaiApiKey = null;
        else if (typeof k === "string" && k.trim()) data.openaiApiKey = k.trim();
      }
      if ("aiMonthlyLimitOverride" in body) {
        const n = Number(body.aiMonthlyLimitOverride);
        if (body.aiMonthlyLimitOverride === null || body.aiMonthlyLimitOverride === "") {
          data.aiMonthlyLimitOverride = null;
        } else if (Number.isFinite(n) && n > 0) {
          const cap = planDefaultAiMonthlyLimit(tier);
          data.aiMonthlyLimitOverride = Math.min(Math.floor(n), cap);
        }
      }
      if ("aiEvalReviewEnforced" in body) {
        data.aiEvalReviewEnforced = Boolean(body.aiEvalReviewEnforced);
      }
      if ("aiEvalReviewMinScore" in body) {
        const n = Number(body.aiEvalReviewMinScore);
        if (Number.isFinite(n)) {
          data.aiEvalReviewMinScore = Math.max(0, Math.min(100, Math.floor(n)));
        }
      }
    }

    if (planAllowsCustomTwilio(tier)) {
      if ("twilioAccountSid" in body && typeof body.twilioAccountSid === "string") {
        data.twilioAccountSid = body.twilioAccountSid.trim() || null;
      }
      if ("twilioAuthToken" in body) {
        const t = body.twilioAuthToken;
        if (t === null || t === "") data.twilioAuthToken = null;
        else if (typeof t === "string" && t.trim()) data.twilioAuthToken = t.trim();
      }
      if ("twilioWhatsAppFrom" in body && typeof body.twilioWhatsAppFrom === "string") {
        data.twilioWhatsAppFrom = body.twilioWhatsAppFrom.trim() || null;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nenhum campo válido para atualizar." }, { status: 400 });
    }

    await prisma.escolaSettings.update({
      where: { schoolId },
      data: data as Prisma.EscolaSettingsUpdateInput,
    });

    return await GET();
  } catch (e) {
    console.error("escola-ia PUT", e);
    return NextResponse.json({ error: "Erro ao salvar." }, { status: 500 });
  }
}
