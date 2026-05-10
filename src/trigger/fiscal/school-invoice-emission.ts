import { logger, task } from "@trigger.dev/sdk/v3";
import { runSchoolInvoiceEmissionRequest } from "@/lib/fiscal/run-school-invoice-emission-request";
import { addSchoolTenantTags } from "../shared/tenant-tags";
import { fiscalInvoicePayloadSchema } from "../shared/payload-schemas";

export const fiscalSchoolInvoiceEmissionTask = task({
  id: "fiscal.school-invoice-emission",
  description:
    "Dispara webhook de emissão fiscal (NFS-e/NF-e) e atualiza emissionRequestedAt quando aplicável.",
  queue: { name: "edu-fiscal-outbound", concurrencyLimit: 15 },
  retry: {
    maxAttempts: 5,
    factor: 2,
    minTimeoutInMs: 3_000,
    maxTimeoutInMs: 60_000,
    randomize: true,
  },
  maxDuration: 180,
  run: async (payload, { ctx }) => {
    const parsed = fiscalInvoicePayloadSchema.safeParse(payload);
    if (!parsed.success) {
      logger.error("fiscal.school-invoice-emission.invalid_payload", {
        issues: parsed.error.flatten(),
        runId: ctx.run.id,
      });
      throw new Error("INVALID_PAYLOAD");
    }

    const p = parsed.data;
    await addSchoolTenantTags(p.schoolId, p.tenantId);

    logger.info("fiscal.school-invoice-emission.start", {
      schoolId: p.schoolId,
      invoiceId: p.invoiceId,
      userId: p.userId,
      runId: ctx.run.id,
    });

    const result = await runSchoolInvoiceEmissionRequest({
      schoolId: p.schoolId,
      invoiceId: p.invoiceId,
      requestedByUserId: p.userId ?? null,
    });

    logger.info("fiscal.school-invoice-emission.success", {
      schoolId: p.schoolId,
      invoiceId: p.invoiceId,
      webhook: result.webhook,
      runId: ctx.run.id,
    });

    return result;
  },
});
