import { prisma } from "@/lib/prisma";
import {
  effectiveAiMonthlyLimit,
  normalizePlanTier,
  planAllowsOpenAi,
  type PlanTier,
} from "@/lib/school-plan";
import { ensureSchoolAiUsageWindow } from "@/lib/ai/school-ai-settings";

export type ResolvedSchoolAi = {
  tier: PlanTier;
  /** Nome amigável da escola (configurações), para contextualizar a EduIA. */
  schoolDisplayName: string;
  apiKey: string;
  monthlyLimit: number;
  usageCount: number;
  limitExceeded: boolean;
  useOpenAi: boolean;
};

/** Resolve limite/chave OpenAI por escola (workers, cron, Trigger.dev). */
export async function resolveSchoolAiForSchoolId(
  schoolId: string
): Promise<ResolvedSchoolAi | null> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { plano: true, escolaSettings: true },
  });

  if (!school) return null;

  let settings = school.escolaSettings;
  if (!settings) {
    settings = await prisma.escolaSettings.create({
      data: { id: schoolId, schoolId, nomeEscola: "Escola" },
    });
  }

  const tier = normalizePlanTier(school.plano);
  const usageRow = await ensureSchoolAiUsageWindow(schoolId, {
    aiUsageCount: settings.aiUsageCount,
    aiUsageResetAt: settings.aiUsageResetAt,
  });

  const usageCount = usageRow?.aiUsageCount ?? settings.aiUsageCount;
  const monthlyLimit = effectiveAiMonthlyLimit(
    tier,
    settings.aiMonthlyLimitOverride
  );
  const useOpenAi = planAllowsOpenAi(tier);
  const apiKey = useOpenAi ? (settings.openaiApiKey?.trim() ?? "") : "";
  const limitExceeded =
    useOpenAi && monthlyLimit > 0 && usageCount >= monthlyLimit;
  const schoolDisplayName = settings.nomeEscola?.trim() || "Escola";

  return {
    tier,
    schoolDisplayName,
    apiKey,
    monthlyLimit,
    usageCount,
    limitExceeded,
    useOpenAi,
  };
}

export async function resolveSchoolAiForUser(user: {
  schoolId: string | null;
}): Promise<ResolvedSchoolAi | null> {
  if (!user.schoolId) return null;
  return resolveSchoolAiForSchoolId(user.schoolId);
}
