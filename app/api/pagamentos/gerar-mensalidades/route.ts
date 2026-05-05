import { NextResponse } from "next/server"
import { generateNextMonthlyPayments } from "@/lib/services/payment-generator"
import { getCurrentUser, requireSchool } from "@/lib/auth"

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const result = await generateNextMonthlyPayments(schoolId)

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