import { prisma } from "@/lib/prisma";

interface RegisterAiAuditParams {
  userId: string;
  message: string;
  intent: string;
  response: string;
  executed?: boolean;
}

export async function registerAiAudit({
  userId,
  message,
  intent,
  response,
  executed = false,
}: RegisterAiAuditParams) {
  try {
    await prisma.aiAuditLog.create({
      data: {
        userId,
        message,
        intent,
        response,
        executed,
      },
    });
  } catch (error) {
    console.error("Erro ao registrar auditoria da EduIA:", error);
  }
}