import { NextResponse } from "next/server"
import { generateNextMonthlyPayments } from "@/lib/services/payment-generator"
import { assertCoreFinanceWrite, getCurrentUser, requireSchool } from "@/lib/auth"
import { logSchoolAudit } from "@/lib/audit/school-audit-log"

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const denied = assertCoreFinanceWrite(user);
    if (denied) return denied;

    const result = await generateNextMonthlyPayments(schoolId)

    void logSchoolAudit({
      schoolId,
      userId: user.id,
      role: user.role,
      domain: "finance",
      action: "MONTHLY_BILLING_GENERATE",
      resourceId: null,
      summary: `Geração de mensalidades em lote: ${result.generatedCount} criadas (matrículas ${result.totalMatriculas}).`,
      payload: {
        totalMatriculas: result.totalMatriculas,
        generatedCount: result.generatedCount,
        boletoGeneratedCount: result.boletoGeneratedCount,
        boletoErrorCount: result.boletoErrorCount,
      },
    });

    return NextResponse.json({
      message: "Mensalidades geradas com sucesso",
      ...result,
    })
  } catch (error) {
    console.error("Erro ao gerar mensalidades:", error)

    return NextResponse.json(
      { error: "Erro ao gerar mensalidades" },
      { status: 500 }
    )
  }
}