/**
 * Regras de produto por plano da escola (`School.plano`, alinhado ao slug do `Plan`).
 *
 * - starter: EduIA sem OpenAI; WhatsApp pelo número da plataforma; apenas Asaas.
 * - basic: OpenAI com chave da escola; WhatsApp plataforma; apenas Asaas.
 * - full: OpenAI com limites maiores; Twilio próprio; pode escolher provedor de cobrança.
 */

export type PlanTier = "starter" | "basic" | "full";

const BASIC_SLUGS = new Set(["basic", "basico", "pro"]);
const FULL_SLUGS = new Set(["full", "completo", "enterprise", "premium"]);

export function normalizePlanTier(plano: string | null | undefined): PlanTier {
  const s = (plano ?? "starter").toLowerCase().trim();
  if (FULL_SLUGS.has(s)) return "full";
  if (BASIC_SLUGS.has(s)) return "basic";
  return "starter";
}

export function planAllowsOpenAi(tier: PlanTier): boolean {
  return tier !== "starter";
}

export function planAllowsCustomTwilio(tier: PlanTier): boolean {
  return tier === "full";
}

/** Apenas Asaas no starter/basic; full pode alterar `billingProvider`. */
export function planAllowsBillingProviderChoice(tier: PlanTier): boolean {
  return tier === "full";
}

export function planDefaultAiMonthlyLimit(tier: PlanTier): number {
  switch (tier) {
    case "starter":
      return 0;
    case "basic":
      return 3000;
    case "full":
      return 20000;
    default:
      return 0;
  }
}

/** Limite efetivo: padrão do plano, ou menor se a escola tiver override válido (nunca acima do teto do plano). */
export function effectiveAiMonthlyLimit(
  tier: PlanTier,
  override: number | null | undefined
): number {
  const cap = planDefaultAiMonthlyLimit(tier);
  if (tier === "starter" || cap === 0) return 0;
  if (override == null || !Number.isFinite(override) || override <= 0) return cap;
  return Math.min(Math.floor(override), cap);
}
