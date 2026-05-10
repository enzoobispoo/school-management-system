import { z } from "zod";

/** Payload base SaaS: uma escola = um tenant lógico. */
export const tenantBaseSchema = z.object({
  schoolId: z.string().min(1),
  tenantId: z.string().min(1),
  userId: z.string().min(1).optional(),
});

export const paymentReminderPayloadSchema = tenantBaseSchema.extend({
  paymentId: z.string().min(1),
  /** Apenas para operações internas (ex.: fila com política explícita). */
  skipCooldown: z.boolean().optional(),
});

export const pluggySyncPayloadSchema = tenantBaseSchema;

export const financeInsightsPayloadSchema = tenantBaseSchema;

export const financeReportPayloadSchema = tenantBaseSchema.extend({
  year: z.number().int().min(2000).max(2100),
  courseCategory: z.string().optional(),
});

export const fiscalInvoicePayloadSchema = tenantBaseSchema.extend({
  invoiceId: z.string().min(1),
});

export const asaasBalancePayloadSchema = tenantBaseSchema;
