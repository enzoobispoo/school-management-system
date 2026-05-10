import { logger, task } from "@trigger.dev/sdk/v3";
import { executePaymentReminderWhatsApp } from "@/lib/automation/payment-reminder-whatsapp";
import { addSchoolTenantTags } from "../shared/tenant-tags";
import { paymentReminderPayloadSchema } from "../shared/payload-schemas";

export const whatsappPaymentReminderTask = task({
  id: "whatsapp.payment-reminder",
  description:
    "Lembrete de mensalidade via WhatsApp (Twilio), com CobrancaEnvio e auditoria opcional.",
  queue: { name: "edu-whatsapp-outbound", concurrencyLimit: 35 },
  retry: {
    maxAttempts: 6,
    factor: 2,
    minTimeoutInMs: 2_000,
    maxTimeoutInMs: 60_000,
    randomize: true,
  },
  maxDuration: 120,
  run: async (payload, { ctx }) => {
    const parsed = paymentReminderPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      logger.error("whatsapp.payment-reminder.invalid_payload", {
        issues: parsed.error.flatten(),
        runId: ctx.run.id,
      });
      throw new Error("INVALID_PAYLOAD");
    }

    const p = parsed.data;
    await addSchoolTenantTags(p.schoolId, p.tenantId);

    logger.info("whatsapp.payment-reminder.start", {
      schoolId: p.schoolId,
      paymentId: p.paymentId,
      userId: p.userId,
      runId: ctx.run.id,
    });

    const result = await executePaymentReminderWhatsApp({
      schoolId: p.schoolId,
      tenantId: p.tenantId,
      paymentId: p.paymentId,
      triggeredByUserId: p.userId ?? null,
      skipCooldown: p.skipCooldown ?? false,
    });

    logger.info("whatsapp.payment-reminder.success", {
      schoolId: p.schoolId,
      paymentId: p.paymentId,
      twilioSid: result.twilioSid,
      runId: ctx.run.id,
    });

    return result;
  },
});
