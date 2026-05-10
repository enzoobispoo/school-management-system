import { logger, task } from "@trigger.dev/sdk/v3";
import { syncPluggyConnectionForSchool } from "@/lib/pluggy/sync-school-connection";
import { addSchoolTenantTags } from "../shared/tenant-tags";
import { pluggySyncPayloadSchema } from "../shared/payload-schemas";

export const bankingPluggySyncSchoolTask = task({
  id: "banking.pluggy-sync-school",
  description:
    "Sincroniza contas e transações Pluggy + reconciliação interna (Open Finance).",
  queue: { name: "edu-banking-sync", concurrencyLimit: 5 },
  retry: {
    maxAttempts: 4,
    factor: 2,
    minTimeoutInMs: 5_000,
    maxTimeoutInMs: 120_000,
    randomize: true,
  },
  maxDuration: 900,
  machine: "medium-1x",
  run: async (payload, { ctx, signal }) => {
    const parsed = pluggySyncPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      logger.error("banking.pluggy-sync-school.invalid_payload", {
        issues: parsed.error.flatten(),
        runId: ctx.run.id,
      });
      throw new Error("INVALID_PAYLOAD");
    }

    const p = parsed.data;
    await addSchoolTenantTags(p.schoolId, p.tenantId);

    logger.info("banking.pluggy-sync-school.start", {
      schoolId: p.schoolId,
      userId: p.userId,
      runId: ctx.run.id,
      aborted: signal.aborted,
    });

    const result = await syncPluggyConnectionForSchool(p.schoolId);

    logger.info("banking.pluggy-sync-school.success", {
      schoolId: p.schoolId,
      ...result,
      runId: ctx.run.id,
    });

    return result;
  },
});
