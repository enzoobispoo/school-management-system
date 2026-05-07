import { NextRequest, NextResponse } from "next/server";
import { evaluateOperationalIncidentsAllSchools } from "@/lib/operacao/engine";
import { readCorrelationIdFromRequest } from "@/lib/observability/correlation";
import { logStructured } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const correlationId = readCorrelationIdFromRequest(request);
  const logPrefix = "[cron:operational-incidents]";
  try {
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET?.trim();

    if (!expectedSecret) {
      logStructured("error", {
        msg: `${logPrefix} missing CRON_SECRET`,
        correlationId,
      });
      return NextResponse.json({ error: "CRON_SECRET não configurado." }, { status: 500 });
    }

    if (authHeader !== `Bearer ${expectedSecret}`) {
      logStructured("warn", {
        msg: `${logPrefix} unauthorized`,
        correlationId,
      });
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    logStructured("info", {
      msg: `${logPrefix} start`,
      correlationId,
    });

    const results = await evaluateOperationalIncidentsAllSchools();
    logStructured("info", {
      msg: `${logPrefix} completed`,
      correlationId,
      schools: results.length,
    });

    return NextResponse.json({
      success: true,
      schools: results.length,
      results,
    });
  } catch (error) {
    logStructured("error", {
      msg: `${logPrefix} failed`,
      correlationId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao avaliar incidentes.",
      },
      { status: 500 }
    );
  }
}
