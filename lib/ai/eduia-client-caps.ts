import type { ResolvedSchoolAi } from "@/lib/ai/resolve-school-ai";
import type { AiSuggestion } from "@/lib/ai/types";
import type { PlanTier } from "@/lib/school-plan";

export type EduiaClientCaps = {
  planTier: PlanTier;
  /** Basic/Full com chave OpenAI, limite mensal > 0 e uso dentro do limite. */
  openAiReady: boolean;
  /** Starter, sem chave, limite estourado ou limite zero efetivo — só consultas rápidas locais. */
  integratedOnly: boolean;
};

/** Caps conservadores até carregar o servidor (evita flash de sugestões incompatíveis). */
export const DEFAULT_EDUIA_CLIENT_CAPS: EduiaClientCaps = {
  planTier: "starter",
  openAiReady: false,
  integratedOnly: true,
};

export function eduiaClientCapsFromResolvedSchoolAi(
  schoolAi: ResolvedSchoolAi | null
): EduiaClientCaps {
  if (!schoolAi) {
    return DEFAULT_EDUIA_CLIENT_CAPS;
  }
  const openAiReady =
    schoolAi.useOpenAi &&
    Boolean(schoolAi.apiKey?.trim()) &&
    !schoolAi.limitExceeded &&
    schoolAi.monthlyLimit > 0;

  return {
    planTier: schoolAi.tier,
    openAiReady,
    integratedOnly: !openAiReady,
  };
}

type SuggestionWithCaps = {
  requiresOpenAi?: boolean;
  requiresFullPlan?: boolean;
  hideForSecretariaAcademic?: boolean;
};

export function suggestionAllowedForCaps(
  item: SuggestionWithCaps,
  caps: EduiaClientCaps
): boolean {
  if (item.requiresFullPlan && caps.planTier !== "full") return false;
  if (item.requiresOpenAi && caps.integratedOnly) return false;
  return true;
}

export function filterAiSuggestionsForCaps<T extends SuggestionWithCaps>(
  items: T[],
  caps: EduiaClientCaps
): T[] {
  return items.filter((item) => suggestionAllowedForCaps(item, caps));
}

/** Resposta da API — sem metadados internos. */
export function publicAiSuggestions(
  items: AiSuggestion[]
): Array<{ label: string; prompt: string }> {
  return items.map(({ label, prompt }) => ({ label, prompt }));
}

export function filterAndPublicAiSuggestions(
  items: AiSuggestion[],
  caps: EduiaClientCaps
): Array<{ label: string; prompt: string }> {
  return publicAiSuggestions(filterAiSuggestionsForCaps(items, caps));
}

export function filterAiSuggestionsForExecutiveSecretariaRole<
  T extends { hideForSecretariaAcademic?: boolean },
>(items: T[], role: string | null | undefined): T[] {
  if (role !== "SECRETARIA") return items;
  return items.filter((item) => !item.hideForSecretariaAcademic);
}

/** Resposta `/api/ai/dashboard`: plano + perfil secretaria acadêmica. */
export function filterAndPublicAiSuggestionsForDashboardUser(
  items: AiSuggestion[],
  caps: EduiaClientCaps,
  role: string | null | undefined
): Array<{ label: string; prompt: string }> {
  const byPlan = filterAiSuggestionsForCaps(items, caps);
  const byRole = filterAiSuggestionsForExecutiveSecretariaRole(byPlan, role);
  return publicAiSuggestions(byRole);
}
