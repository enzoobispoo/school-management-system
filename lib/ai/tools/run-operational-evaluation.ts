import type { PlanTier } from "@/lib/school-plan";
import { evaluateOperationalIncidentsForSchool } from "@/lib/operacao/engine";

/** Executa a mesma avaliação da Central operacional ("Avaliar agora") sob demanda — restrito ao plano Full. */
export async function runOperationalEvaluationTool(
  args: { confirmed?: boolean },
  schoolId?: string | null,
  planTier?: PlanTier
) {
  const sid = schoolId?.trim();
  if (!sid) {
    return { ok: false, error: "missing_school" };
  }

  if (planTier !== "full") {
    return {
      ok: false,
      error: "plan_full_required",
      message:
        "Disparar a avaliação operacional pela EduIA está liberado apenas no plano Full. Nos outros planos, use o botão \"Avaliar agora\" em /operacao ou converse sobre incidentes já listados.",
    };
  }

  if (!args.confirmed) {
    return {
      ok: false,
      needsConfirmation: true,
      instrucao:
        "Explique que isso roda os detectores e pode criar/atualizar incidentes e notificações. Peça confirmação. Quando o usuário aceitar, chame novamente com confirmed:true. Frase exata sugerida: confirmar avaliação operacional",
    };
  }

  const summaries = await evaluateOperationalIncidentsForSchool(sid);

  return {
    ok: true,
    playbooksAvaliados: summaries.length,
    detalhes: summaries.slice(0, 30),
  };
}
