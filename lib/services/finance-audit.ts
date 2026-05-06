import { prisma } from "@/lib/prisma";

interface LogFinanceAuditEventInput {
  schoolId: string;
  eventType: string;
  source: "webhook" | "cron" | "manual" | "api";
  status: "success" | "ignored" | "failed";
  message: string;
  referenceId?: string | null;
  payload?: unknown;
}

export async function logFinanceAuditEvent(input: LogFinanceAuditEventInput) {
  return prisma.financeAuditEvent.create({
    data: {
      schoolId: input.schoolId,
      eventType: input.eventType,
      source: input.source,
      status: input.status,
      message: input.message,
      referenceId: input.referenceId ?? null,
      payload: input.payload ?? undefined,
    },
  });
}

