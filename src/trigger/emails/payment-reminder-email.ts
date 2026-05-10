import { logger, task } from "@trigger.dev/sdk/v3";
import { sendPaymentReminderEmail } from "@/lib/email/send-payment-reminder-email";
import { addSchoolTenantTags } from "../shared/tenant-tags";
import { tenantBaseSchema } from "../shared/payload-schemas";
import { z } from "zod";

const schema = tenantBaseSchema.extend({ paymentId: z.string().min(1) });

export const emailPaymentReminderTask = task({
  id: "emails.payment-reminder",
  description: "E-mail de lembrete de mensalidade via Resend.",
  queue: { name: "edu-email-outbound", concurrencyLimit: 25 },
  retry: {
    maxAttempts: 6,
    factor: 2,
    minTimeoutInMs: 2_000,
    maxTimeoutInMs: 45_000,
    randomize: true,
  },
  maxDuration: 120,
  run: async (payload, { ctx }) => {
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      logger.error("emails.payment-reminder.invalid_payload", {
        issues: parsed.error.flatten(),
        runId: ctx.run.id,
      });
      throw new Error("INVALID_PAYLOAD");
    }

    const p = parsed.data;
    await addSchoolTenantTags(p.schoolId, p.tenantId);

    logger.info("emails.payment-reminder.start", {
      schoolId: p.schoolId,
      paymentId: p.paymentId,
      userId: p.userId,
      runId: ctx.run.id,
    });

    const result = await sendPaymentReminderEmail({
      schoolId: p.schoolId,
      paymentId: p.paymentId,
    });

    logger.info("emails.payment-reminder.success", {
      schoolId: p.schoolId,
      paymentId: p.paymentId,
      resendId: result.resendId,
      runId: ctx.run.id,
    });

    return result;
  },
});
