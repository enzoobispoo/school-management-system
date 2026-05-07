import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNextMonthlyPayments } from "@/lib/services/payment-generator";
import { logFinanceAuditEvent } from "@/lib/services/finance-audit";
import { readCorrelationIdFromRequest } from "@/lib/observability/correlation";
import { logStructured } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorizedCron(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET?.trim();
  if (!expectedSecret) return { ok: false as const, reason: "CRON_SECRET não configurado." };
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${expectedSecret}`) {
    return { ok: false as const, reason: "Não autorizado." };
  }
  return { ok: true as const };
}

export async function GET(request: NextRequest) {
  const correlationId = readCorrelationIdFromRequest(request);
  try {
    const auth = isAuthorizedCron(request);
    if (!auth.ok) {
      logStructured("warn", {
        event: "cron_recorrencia_mensalidades_unauthorized",
        correlationId,
        reason: auth.reason,
      });
      return NextResponse.json({ error: auth.reason }, { status: 401 });
    }

    logStructured("info", {
      event: "cron_recorrencia_mensalidades_start",
      correlationId,
    });

    const schools = await prisma.school.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
    });

    const results = await Promise.all(
      schools.map(async (school) => {
        try {
          const generated = await generateNextMonthlyPayments(school.id);
          await logFinanceAuditEvent({
            schoolId: school.id,
            eventType: "MONTHLY_PAYMENTS_RECURRING_GENERATED",
            source: "cron",
            status: "success",
            message: "Recorrência de mensalidades executada.",
            payload: generated,
          });
          return {
            schoolId: school.id,
            schoolNome: school.nome,
            ...generated,
          };
        } catch (error) {
          await logFinanceAuditEvent({
            schoolId: school.id,
            eventType: "MONTHLY_PAYMENTS_RECURRING_FAILED",
            source: "cron",
            status: "failed",
            message:
              error instanceof Error
                ? error.message
                : "Falha na recorrência de mensalidades.",
          });
          throw error;
        }
      })
    );

    return NextResponse.json({
      success: true,
      schools: results.length,
      results,
    });
  } catch (error) {
    console.error("Erro ao executar recorrência de mensalidades:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao executar recorrência de mensalidades.",
      },
      { status: 500 }
    );
  }
}

