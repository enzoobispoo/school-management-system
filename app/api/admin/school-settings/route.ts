import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { maskApiKey } from "@/lib/ia/system-settings";
import { normalizePlanTier } from "@/lib/school-plan";
import { API_FORBIDDEN_PROFILE } from "@/lib/http/api-forbidden";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function maskWalletId(id: string | null | undefined) {
  if (!id?.trim()) return null;
  const t = id.trim();
  if (t.length <= 8) return "••••••••";
  return `${t.slice(0, 4)}••••${t.slice(-4)}`;
}

function maskTwilioToken(t: string | null | undefined) {
  if (!t?.trim()) return null;
  const s = t.trim();
  if (s.length <= 6) return "••••••";
  return `${s.slice(0, 3)}••••${s.slice(-2)}`;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: API_FORBIDDEN_PROFILE }, { status: 403 });
  }

  const schoolId = request.nextUrl.searchParams.get("schoolId");
  if (!schoolId) return NextResponse.json({ error: "schoolId obrigatório." }, { status: 400 });

  const schoolMeta = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { nome: true, plano: true },
  });
  if (!schoolMeta) return NextResponse.json({ error: "Escola não encontrada." }, { status: 404 });

  let settings = await prisma.escolaSettings.findUnique({ where: { schoolId } });
  if (!settings) {
    settings = await prisma.escolaSettings.create({
      data: { id: schoolId, schoolId, nomeEscola: schoolMeta.nome },
    });
  }

  const {
    asaasApiKey,
    asaasWalletId,
    openaiApiKey,
    twilioAuthToken,
    ...rest
  } = settings;

  return NextResponse.json({
    ...rest,
    hasAsaasApiKey: Boolean(asaasApiKey?.trim()),
    maskedAsaasApiKey: maskApiKey(asaasApiKey),
    hasAsaasWallet: Boolean(asaasWalletId?.trim()),
    maskedAsaasWalletId: maskWalletId(asaasWalletId),
    hasOpenaiApiKey: Boolean(openaiApiKey?.trim()),
    maskedOpenaiApiKey: maskApiKey(openaiApiKey),
    hasTwilioAuthToken: Boolean(twilioAuthToken?.trim()),
    maskedTwilioAuthToken: maskTwilioToken(twilioAuthToken),
    multaAtrasoPercentual: settings.multaAtrasoPercentual ? Number(settings.multaAtrasoPercentual) : null,
    jurosMensalPercentual: settings.jurosMensalPercentual ? Number(settings.jurosMensalPercentual) : null,
    metaMensal: settings.metaMensal ? Number(settings.metaMensal) : null,
    hasPlatformAsaasFallback: Boolean(process.env.ASAAS_API_KEY?.trim()),
    planTier: normalizePlanTier(schoolMeta.plano),
    schoolPlano: schoolMeta.plano,
  });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: API_FORBIDDEN_PROFILE }, { status: 403 });
  }

  const body = await request.json() as Record<string, unknown>;
  const schoolId = body.schoolId as string | undefined;
  if (!schoolId) return NextResponse.json({ error: "schoolId obrigatório." }, { status: 400 });

  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { nome: true } });
  if (!school) return NextResponse.json({ error: "Escola não encontrada." }, { status: 404 });

  const update: Prisma.EscolaSettingsUpdateInput = {};

  if ("asaasWalletId" in body) {
    const w = body.asaasWalletId;
    if (w === null || w === "") update.asaasWalletId = null;
    else if (typeof w === "string" && w.trim()) update.asaasWalletId = w.trim();
  }
  if ("asaasEnvironment" in body && typeof body.asaasEnvironment === "string") {
    const e = body.asaasEnvironment.trim();
    update.asaasEnvironment = e === "production" ? "production" : "sandbox";
  }
  if ("billingProvider" in body && typeof body.billingProvider === "string") {
    update.billingProvider = body.billingProvider.trim() || "asaas";
  }
  if ("billingEnabled" in body) update.billingEnabled = Boolean(body.billingEnabled);
  if ("defaultChargeMethod" in body && typeof body.defaultChargeMethod === "string") {
    update.defaultChargeMethod = body.defaultChargeMethod.trim() || "boleto";
  }
  if ("autoGenerateBoleto" in body) update.autoGenerateBoleto = Boolean(body.autoGenerateBoleto);
  if ("autoSendBoletoWhatsApp" in body) update.autoSendBoletoWhatsApp = Boolean(body.autoSendBoletoWhatsApp);

  if ("asaasApiKey" in body) {
    const k = body.asaasApiKey;
    if (k === null || k === "") {
      update.asaasApiKey = null;
    } else if (typeof k === "string" && k.trim()) {
      update.asaasApiKey = k.trim();
    }
  }

  if ("openaiApiKey" in body) {
    const k = body.openaiApiKey;
    if (k === null || k === "") update.openaiApiKey = null;
    else if (typeof k === "string" && k.trim()) update.openaiApiKey = k.trim();
  }
  if ("aiMonthlyLimitOverride" in body) {
    const n = Number(body.aiMonthlyLimitOverride);
    if (body.aiMonthlyLimitOverride === null || body.aiMonthlyLimitOverride === "") {
      update.aiMonthlyLimitOverride = null;
    } else if (Number.isFinite(n) && n > 0) {
      update.aiMonthlyLimitOverride = Math.floor(n);
    }
  }
  if ("twilioAccountSid" in body && typeof body.twilioAccountSid === "string") {
    update.twilioAccountSid = body.twilioAccountSid.trim() || null;
  }
  if ("twilioAuthToken" in body) {
    const t = body.twilioAuthToken;
    if (t === null || t === "") update.twilioAuthToken = null;
    else if (typeof t === "string" && t.trim()) update.twilioAuthToken = t.trim();
  }
  if ("twilioWhatsAppFrom" in body && typeof body.twilioWhatsAppFrom === "string") {
    update.twilioWhatsAppFrom = body.twilioWhatsAppFrom.trim() || null;
  }

  const existing = await prisma.escolaSettings.findUnique({ where: { schoolId } });
  const settings = existing
    ? await prisma.escolaSettings.update({ where: { schoolId }, data: update })
    : await prisma.escolaSettings.create({
        data: {
          id: schoolId,
          schoolId,
          nomeEscola: school.nome,
          asaasApiKey: update.asaasApiKey === null || typeof update.asaasApiKey === "string"
            ? (update.asaasApiKey as string | null)
            : undefined,
          asaasWalletId: update.asaasWalletId === null || typeof update.asaasWalletId === "string"
            ? (update.asaasWalletId as string | null)
            : undefined,
          asaasEnvironment: typeof update.asaasEnvironment === "string" ? update.asaasEnvironment : undefined,
          billingProvider: typeof update.billingProvider === "string" ? update.billingProvider : undefined,
          billingEnabled: typeof update.billingEnabled === "boolean" ? update.billingEnabled : undefined,
          defaultChargeMethod: typeof update.defaultChargeMethod === "string" ? update.defaultChargeMethod : undefined,
          autoGenerateBoleto: typeof update.autoGenerateBoleto === "boolean" ? update.autoGenerateBoleto : undefined,
          autoSendBoletoWhatsApp: typeof update.autoSendBoletoWhatsApp === "boolean"
            ? update.autoSendBoletoWhatsApp
            : undefined,
          openaiApiKey: update.openaiApiKey === null || typeof update.openaiApiKey === "string"
            ? (update.openaiApiKey as string | null)
            : undefined,
          aiMonthlyLimitOverride:
            update.aiMonthlyLimitOverride === null || typeof update.aiMonthlyLimitOverride === "number"
              ? (update.aiMonthlyLimitOverride as number | null)
              : undefined,
          twilioAccountSid: typeof update.twilioAccountSid === "string" ? update.twilioAccountSid : undefined,
          twilioAuthToken: update.twilioAuthToken === null || typeof update.twilioAuthToken === "string"
            ? (update.twilioAuthToken as string | null)
            : undefined,
          twilioWhatsAppFrom: typeof update.twilioWhatsAppFrom === "string" ? update.twilioWhatsAppFrom : undefined,
        },
      });

  const {
    asaasApiKey: _k,
    asaasWalletId: _w,
    openaiApiKey: _o,
    twilioAuthToken: _tw,
    ...rest
  } = settings;

  return NextResponse.json({
    success: true,
    settings: {
      ...rest,
      hasAsaasApiKey: Boolean(_k?.trim()),
      maskedAsaasApiKey: maskApiKey(_k),
      hasAsaasWallet: Boolean(_w?.trim()),
      maskedAsaasWalletId: maskWalletId(_w),
      hasOpenaiApiKey: Boolean(_o?.trim()),
      maskedOpenaiApiKey: maskApiKey(_o),
      hasTwilioAuthToken: Boolean(_tw?.trim()),
      maskedTwilioAuthToken: maskTwilioToken(_tw),
    },
  });
}
