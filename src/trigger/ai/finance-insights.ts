import { logger, task } from "@trigger.dev/sdk/v3";
import { generateFinanceInsightsOpenAI } from "@/lib/automation/generate-finance-insights-openai";
import { addSchoolTenantTags } from "../shared/tenant-tags";
import { financeInsightsPayloadSchema } from "../shared/payload-schemas";

export const aiFinanceInsightsTask = task({
  id: "ai.finance-insights",
  description:
    "Insights financeiros com OpenAI a partir do snapshot interno (sem dados inventados).",
  queue: { name: "edu-ai-finance", concurrencyLimit: 8 },
  retry: {
    maxAttempts: 4,
    factor: 2,
    minTimeoutInMs: 3_000,
    maxTimeoutInMs: 90_000,
    randomize: true,
  },
  maxDuration: 300,
  run: async (payload, { ctx }) => {
    const parsed = financeInsightsPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      logger.error("ai.finance-insights.invalid_payload", {
        issues: parsed.error.flatten(),
        runId: ctx.run.id,
      });
      throw new Error("INVALID_PAYLOAD");
    }

    const p = parsed.data;
    await addSchoolTenantTags(p.schoolId, p.tenantId);

    logger.info("ai.finance-insights.start", {
      schoolId: p.schoolId,
      userId: p.userId,
      runId: ctx.run.id,
    });

    const out = await generateFinanceInsightsOpenAI({
      schoolId: p.schoolId,
      tenantId: p.tenantId,
    });

    logger.info("ai.finance-insights.success", {
      schoolId: p.schoolId,
      model: out.model,
      runId: ctx.run.id,
    });

    return out;
  },
});
