import { NextRequest, NextResponse } from "next/server";
import { evaluateOperationalIncidentsAllSchools } from "@/lib/operacao/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET?.trim();

    if (!expectedSecret) {
      return NextResponse.json({ error: "CRON_SECRET não configurado." }, { status: 500 });
    }

    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const results = await evaluateOperationalIncidentsAllSchools();

    return NextResponse.json({
      success: true,
      schools: results.length,
      results,
    });
  } catch (error) {
    console.error("Cron operational-incidents:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao avaliar incidentes.",
      },
      { status: 500 }
    );
  }
}
