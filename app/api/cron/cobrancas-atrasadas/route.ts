import { NextRequest, NextResponse } from "next/server";
import { sendAutomaticOverdueReminders } from "@/lib/services/auto-payment-reminder";
import { retryFailedCobrancas } from "@/lib/services/retry-failed-cobrancas";
import { autoSuspendOverdueEnrollments } from "@/lib/services/auto-suspend-overdue-enrollments";
import { enforceSubscriptionDelinquencyPolicy } from "@/lib/services/enforce-subscription-delinquency-policy";
import { logFinanceAuditEvent } from "@/lib/services/finance-audit";
import { prisma } from "@/lib/prisma";
import { readCorrelationIdFromRequest } from "@/lib/observability/correlation";
import { logStructured } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const correlationId = readCorrelationIdFromRequest(request);
  try {
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET?.trim();

    if (!expectedSecret) {
      logStructured("error", {
        event: "cron_cobrancas_atrasadas_config",
        correlationId,
        message: "CRON_SECRET não configurado.",
      });
      return NextResponse.json({ error: "CRON_SECRET não configurado." }, { status: 500 });
    }

    if (authHeader !== `Bearer ${expectedSecret}`) {
      logStructured("warn", {
        event: "cron_cobrancas_atrasadas_unauthorized",
        correlationId,
      });
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    logStructured("info", {
      event: "cron_cobrancas_atrasadas_start",
      correlationId,
    });

    // Run for all active schools
    const schools = await prisma.school.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
    });

    const results = await Promise.all(
      schools.map(async (school) => {
        try {
          const overdueResult = await sendAutomaticOverdueReminders(school.id);
          const retryResult = await retryFailedCobrancas(school.id);
          const suspendResult = await autoSuspendOverdueEnrollments(school.id);
          const subscriptionPolicyResult =
            await enforceSubscriptionDelinquencyPolicy(school.id);

          await logFinanceAuditEvent({
            schoolId: school.id,
            eventType: "CRON_COBRANCAS_ATRASADAS_EXECUTED",
            source: "cron",
            status: "success",
            message: "Execução da rotina de cobrança atrasada concluída.",
            payload: {
              sentOverdue: overdueResult.sentCount,
              retried: retryResult.retriedCount,
              suspendedEnrollments: suspendResult.suspended,
              subscriptionPolicyAffected: subscriptionPolicyResult.affected,
            },
          });

          return {
            schoolId: school.id,
            schoolNome: school.nome,
            overdueResult,
            retryResult,
            suspendResult,
            subscriptionPolicyResult,
          };
        } catch (error) {
          await logFinanceAuditEvent({
            schoolId: school.id,
            eventType: "CRON_COBRANCAS_ATRASADAS_FAILED",
            source: "cron",
            status: "failed",
            message:
              error instanceof Error
                ? error.message
                : "Falha ao executar rotina de cobrança atrasada.",
          });
          throw error;
        }
      })
    );

    logStructured("info", {
      event: "cron_cobrancas_atrasadas_done",
      correlationId,
      schools: results.length,
    });

    return NextResponse.json({ success: true, schools: results.length, results });
  } catch (error) {
    logStructured("error", {
      event: "cron_cobrancas_atrasadas_failed",
      correlationId,
      message:
        error instanceof Error
          ? error.message
          : "Erro ao executar cobrança automática.",
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao executar cobrança automática." },
      { status: 500 }
    );
  }
}
