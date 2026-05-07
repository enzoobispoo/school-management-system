import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logStructured } from "@/lib/observability/logger";

export type AiToolRunAuditEntry = {
  tool: string;
  durationMs: number;
  error?: string;
};

interface RegisterAiAuditParams {
  userId: string;
  schoolId?: string | null;
  correlationId?: string | null;
  message: string;
  intent: string;
  response: string;
  executed?: boolean;
  toolRuns?: AiToolRunAuditEntry[] | null;
}

export async function registerAiAudit({
  userId,
  schoolId,
  correlationId,
  message,
  intent,
  response,
  executed = false,
  toolRuns,
}: RegisterAiAuditParams) {
  try {
    await prisma.aiAuditLog.create({
      data: {
        userId,
        schoolId: schoolId ?? undefined,
        correlationId: correlationId ?? undefined,
        message,
        intent,
        response,
        executed,
        toolRuns:
          toolRuns && toolRuns.length > 0
            ? (toolRuns as unknown as Prisma.InputJsonValue)
            : undefined,
      },
    });
  } catch (error) {
    logStructured("error", {
      event: "ai_audit_write_failed",
      userId,
      schoolId: schoolId ?? null,
      correlationId: correlationId ?? null,
      message:
        error instanceof Error ? error.message : "Erro desconhecido ao auditar EduIA.",
    });
  }
}
