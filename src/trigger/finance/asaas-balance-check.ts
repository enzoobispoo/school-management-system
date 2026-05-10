import { logger, task } from "@trigger.dev/sdk/v3";
import { fetchAsaasFinanceBalance } from "@/lib/billing/asaas-school-client";
import { addSchoolTenantTags } from "../shared/tenant-tags";
import { asaasBalancePayloadSchema } from "../shared/payload-schemas";

export const financeAsaasBalanceCheckTask = task({
  id: "finance.asaas-balance-check",
  description:
    "Verifica conectividade e saldo Asaas por escola (GET /finance/balance).",
  queue: { name: "edu-finance-integrations", concurrencyLimit: 20 },
  retry: {
    maxAttempts: 5,
    factor: 2,
    minTimeoutInMs: 2_000,
    maxTimeoutInMs: 40_000,
    randomize: true,
  },
  maxDuration: 120,
  run: async (payload, { ctx }) => {
    const parsed = asaasBalancePayloadSchema.safeParse(payload);
    if (!parsed.success) {
      logger.error("finance.asaas-balance-check.invalid_payload", {
        issues: parsed.error.flatten(),
        runId: ctx.run.id,
      });
      throw new Error("INVALID_PAYLOAD");
    }

    const p = parsed.data;
    await addSchoolTenantTags(p.schoolId, p.tenantId);

    logger.info("finance.asaas-balance-check.start", {
      schoolId: p.schoolId,
      userId: p.userId,
      runId: ctx.run.id,
    });

    const balance = await fetchAsaasFinanceBalance(p.schoolId);

    logger.info("finance.asaas-balance-check.success", {
      schoolId: p.schoolId,
      balance,
      runId: ctx.run.id,
    });

    return { balance };
  },
});
