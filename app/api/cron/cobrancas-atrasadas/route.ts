import { NextRequest, NextResponse } from "next/server";
import { sendAutomaticOverdueReminders } from "@/lib/services/auto-payment-reminder";
import { retryFailedCobrancas } from "@/lib/services/retry-failed-cobrancas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET?.trim();

    if (!expectedSecret) {
      return NextResponse.json(
        { error: "CRON_SECRET não configurado." },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const overdueResult = await sendAutomaticOverdueReminders();

    const retryResult = await retryFailedCobrancas();

    return NextResponse.json({
      success: true,
      overdueResult,
      retryResult,
    });
  } catch (error) {
    console.error("Erro ao executar cobrança automática:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao executar cobrança automática.",
      },
      { status: 500 }
    );
  }
}