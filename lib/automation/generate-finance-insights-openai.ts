import "server-only";

import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { resolveSchoolAiForSchoolId } from "@/lib/ai/resolve-school-ai";
import { incrementSchoolAiUsage } from "@/lib/ai/school-ai-settings";
import { buildFinanceMetricsSnapshot } from "@/lib/finance/finance-metrics-snapshot";

export type GenerateFinanceInsightsParams = {
  schoolId: string;
  tenantId: string;
};

/**
 * Gera texto de insights financeiros com OpenAI usando apenas métricas já calculadas no sistema.
 */
export async function generateFinanceInsightsOpenAI(
  params: GenerateFinanceInsightsParams
): Promise<{ insight: string; model: string }> {
  if (params.schoolId !== params.tenantId) {
    throw new Error("tenantId deve coincidir com schoolId.");
  }

  const schoolAi = await resolveSchoolAiForSchoolId(params.schoolId);
  if (
    !schoolAi?.useOpenAi ||
    !schoolAi.apiKey ||
    schoolAi.limitExceeded ||
    schoolAi.monthlyLimit <= 0
  ) {
    throw new Error("OPENAI_UNAVAILABLE_OR_LIMIT");
  }

  const snapshot = await buildFinanceMetricsSnapshot(params.schoolId);
  const client = new OpenAI({ apiKey: schoolAi.apiKey });
  const model = process.env.OPENAI_AUTOMATION_MODEL ?? "gpt-4o-mini";

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content: `Você é analista financeiro para uma escola (gestão de mensalidades).
Regras:
- Use apenas números do JSON fornecido; não invente valores.
- Responda em português do Brasil, até 12 frases objetivas.
- Priorize risco de inadimplência, cobrança e reconciliação.`,
      },
      {
        role: "user",
        content: `Escola: ${schoolAi.schoolDisplayName}
Métricas (JSON):
${JSON.stringify(snapshot)}`,
      },
    ],
    store: false,
  });

  const insight =
    response.output_text?.trim() ||
    "Não foi possível gerar insights nesta execução.";

  await incrementSchoolAiUsage(params.schoolId, 1);

  await prisma.financeAuditEvent.create({
    data: {
      schoolId: params.schoolId,
      eventType: "AUTOMATION_FINANCE_INSIGHTS",
      source: "openai.automation",
      status: "OK",
      message: "Insights financeiros gerados (OpenAI).",
      payload: { model },
    },
  });

  return { insight, model };
}
