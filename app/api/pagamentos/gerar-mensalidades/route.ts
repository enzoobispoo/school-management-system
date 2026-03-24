import { NextResponse } from "next/server"
import { generateNextMonthlyPayments } from "@/lib/services/payment-generator"

export async function POST() {
  try {
    const result = await generateNextMonthlyPayments()

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