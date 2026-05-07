import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, resolveSchoolScopeForRequest } from "@/lib/auth";
import { evaluateOperationalIncidentsForSchool } from "@/lib/operacao/engine";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const schoolGate = await resolveSchoolScopeForRequest(user, request);
    if (schoolGate instanceof NextResponse) return schoolGate;
    const { schoolId } = schoolGate;

    const summaries = await evaluateOperationalIncidentsForSchool(schoolId);

    return NextResponse.json({
      ok: true,
      summaries,
    });
  } catch (error) {
    console.error("Erro ao avaliar operação:", error);
    return NextResponse.json(
      { error: "Erro ao executar avaliação operacional." },
      { status: 500 }
    );
  }
}
