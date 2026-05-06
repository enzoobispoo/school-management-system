import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  normalizePlanTier,
  planAllowsBillingProviderChoice,
  planAllowsCustomTwilio,
  planAllowsOpenAi,
} from "@/lib/school-plan";

export type InviteIntegrationInput = {
  asaasApiKey?: string;
  asaasWalletId?: string;
  openaiApiKey?: string;
  aiMonthlyLimitOverride?: number | null;
  billingProvider?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioWhatsAppFrom?: string;
};

function hasIntegrationPayload(b: InviteIntegrationInput) {
  const limOk =
    typeof b.aiMonthlyLimitOverride === "number" &&
    Number.isFinite(b.aiMonthlyLimitOverride) &&
    b.aiMonthlyLimitOverride > 0;
  return (
    (b.asaasApiKey && b.asaasApiKey.trim()) ||
    (b.asaasWalletId && b.asaasWalletId.trim()) ||
    (b.openaiApiKey && b.openaiApiKey.trim()) ||
    limOk ||
    (b.billingProvider && b.billingProvider.trim()) ||
    (b.twilioAccountSid && b.twilioAccountSid.trim()) ||
    (b.twilioAuthToken && b.twilioAuthToken.trim()) ||
    (b.twilioWhatsAppFrom && b.twilioWhatsAppFrom.trim())
  );
}

/** Aplica chaves / provedor respeitando o tier da escola (já atualizado se o plano mudou). */
export async function applyInviteOptionalIntegrations(
  schoolId: string,
  body: InviteIntegrationInput
) {
  if (!hasIntegrationPayload(body)) return;

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { nome: true, plano: true },
  });
  if (!school) return;

  const tier = normalizePlanTier(school.plano);
  const update: Prisma.EscolaSettingsUpdateInput = {};

  if (body.asaasApiKey?.trim()) update.asaasApiKey = body.asaasApiKey.trim();
  if (body.asaasWalletId?.trim()) update.asaasWalletId = body.asaasWalletId.trim();

  if (planAllowsOpenAi(tier)) {
    if (body.openaiApiKey?.trim()) update.openaiApiKey = body.openaiApiKey.trim();
    if (
      typeof body.aiMonthlyLimitOverride === "number" &&
      Number.isFinite(body.aiMonthlyLimitOverride) &&
      body.aiMonthlyLimitOverride > 0
    ) {
      update.aiMonthlyLimitOverride = Math.floor(body.aiMonthlyLimitOverride);
    }
  }

  if (planAllowsBillingProviderChoice(tier) && body.billingProvider?.trim()) {
    update.billingProvider = body.billingProvider.trim();
  }

  if (planAllowsCustomTwilio(tier)) {
    if (typeof body.twilioAccountSid === "string") {
      update.twilioAccountSid = body.twilioAccountSid.trim() || null;
    }
    if (body.twilioAuthToken?.trim()) update.twilioAuthToken = body.twilioAuthToken.trim();
    if (typeof body.twilioWhatsAppFrom === "string") {
      update.twilioWhatsAppFrom = body.twilioWhatsAppFrom.trim() || null;
    }
  }

  if (Object.keys(update).length === 0) return;

  const existing = await prisma.escolaSettings.findUnique({ where: { schoolId } });
  if (!existing) {
    await prisma.escolaSettings.create({
      data: {
        id: schoolId,
        schoolId,
        nomeEscola: school.nome,
      },
    });
  }
  await prisma.escolaSettings.update({ where: { schoolId }, data: update });
}
