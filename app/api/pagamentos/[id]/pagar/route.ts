import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))

    const pagamento = await prisma.pagamento.findUnique({
      where: { id },
      include: {
        matricula: {
          include: {
            aluno: true,
            turma: {
              include: {
                curso: true,
              },
            },
          },
        },
      },
    })

    if (!pagamento) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      )
    }

    if (pagamento.status === "PAGO") {
      return NextResponse.json(
        { error: "Pagamento já foi realizado" },
        { status: 400 }
      )
    }

    const pagamentoAtualizado = await prisma.pagamento.update({
      where: { id },
      data: {
        status: "PAGO",
        dataPagamento: new Date(),
        metodoPagamento: body.metodoPagamento || null,
      },
    })

    await prisma.notificacao.create({
      data: {
        tipo: "PAGAMENTO",
        titulo: "Pagamento recebido",
        mensagem: `${pagamento.matricula.aluno.nome} pagou ${pagamento.matricula.turma.curso.nome}.`,
        entidadeTipo: "PAGAMENTO",
        entidadeId: pagamento.id,
      },
    })

    return NextResponse.json(pagamentoAtualizado)
  } catch (error) {
    console.error("Erro ao registrar pagamento:", error)
    return NextResponse.json(
      { error: "Erro ao registrar pagamento" },
      { status: 500 }
    )
  }
}

