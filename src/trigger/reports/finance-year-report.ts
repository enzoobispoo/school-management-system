import { logger, task } from "@trigger.dev/sdk/v3";
import { buildSchoolFinanceReport } from "@/lib/reports/build-school-finance-report";
import { addSchoolTenantTags } from "../shared/tenant-tags";
import { financeReportPayloadSchema } from "../shared/payload-schemas";

export const reportsFinanceYearTask = task({
  id: "reports.finance-year",
  description:
    "Gera pacote de relatórios financeiros/analíticos por escola e ano (background).",
  queue: { name: "edu-reports", concurrencyLimit: 6 },
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 2_000,
    maxTimeoutInMs: 45_000,
    randomize: true,
  },
  maxDuration: 600,
  machine: "medium-1x",
  run: async (payload, { ctx }) => {
    const parsed = financeReportPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      logger.error("reports.finance-year.invalid_payload", {
        issues: parsed.error.flatten(),
        runId: ctx.run.id,
      });
      throw new Error("INVALID_PAYLOAD");
    }

    const p = parsed.data;
    await addSchoolTenantTags(p.schoolId, p.tenantId);

    logger.info("reports.finance-year.start", {
      schoolId: p.schoolId,
      year: p.year,
      courseCategory: p.courseCategory,
      userId: p.userId,
      runId: ctx.run.id,
    });

    const report = await buildSchoolFinanceReport({
      schoolId: p.schoolId,
      year: p.year,
      courseCategory: p.courseCategory,
    });

    logger.info("reports.finance-year.success", {
      schoolId: p.schoolId,
      year: p.year,
      runId: ctx.run.id,
    });

    return { generatedAt: new Date().toISOString(), report };
  },
});
