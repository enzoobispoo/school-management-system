import { NextResponse } from "next/server";
import {
  assertFinanceRead,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";
import { buildFinanceMetricsSnapshot } from "@/lib/finance/finance-metrics-snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const forbidden = assertFinanceRead(user);
    if (forbidden) return forbidden;

    const schoolResult = requireSchool(user);
    if (schoolResult instanceof NextResponse) return schoolResult;
    const { schoolId } = schoolResult;

    const snapshot = await buildFinanceMetricsSnapshot(schoolId);

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("Erro ao carregar métricas financeiras:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar métricas financeiras." },
      { status: 500 }
    );
  }
}
