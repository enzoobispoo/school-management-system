import type { PlanTier } from "@/lib/school-plan";
import { planTierDisplayLabelPt } from "@/lib/school-plan";

export function operatorFirstName(fullName: string): string {
  const t = fullName.trim();
  if (!t) return "";
  return t.split(/\s+/)[0] ?? t;
}

/** Contexto enxuto para o modelo agir como copiloto da escola (sessão atual). */
export function buildEduiaOperatorBriefing(input: {
  schoolDisplayName: string;
  operatorFullName: string;
  planTier: PlanTier;
  aiUsageCount?: number;
  aiMonthlyLimit?: number;
}): string {
  const tz = "America/Sao_Paulo";
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  const planLabel = planTierDisplayLabelPt(input.planTier);
  const first = operatorFirstName(input.operatorFullName);
  const who = first ? `Operador: ${first}.` : "Operador: (nome não disponível).";

  let usage = "";
  if (
    input.aiMonthlyLimit != null &&
    input.aiMonthlyLimit > 0 &&
    input.aiUsageCount != null &&
    Number.isFinite(input.aiUsageCount)
  ) {
    usage = ` Uso de mensagens IA no período: ${input.aiUsageCount}/${input.aiMonthlyLimit}.`;
  }

  return `Escola: ${input.schoolDisplayName}. ${who} Plano: ${planLabel}. Referência (${tz}): ${formatted}.${usage}`;
}
