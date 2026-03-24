import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateNotificacaoSchema } from "@/lib/validations/notificacao"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const notificacao = await prisma.notificacao.findUnique({
      where: { id },
    })

    if (!notificacao) {
      return NextResponse.json(
        { error: "Notificação não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(notificacao)
  } catch (error) {
    console.error("Erro ao buscar notificação:", error)
    return NextResponse.json(
      { error: "Erro ao buscar notificação" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const parsed = updateNotificacaoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const notificacaoExistente = await prisma.notificacao.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!notificacaoExistente) {
      return NextResponse.json(
        { error: "Notificação não encontrada" },
        { status: 404 }
      )
    }

    const notificacao = await prisma.notificacao.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json(notificacao)
  } catch (error) {
    console.error("Erro ao atualizar notificação:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar notificação" },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const notificacao = await prisma.notificacao.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!notificacao) {
      return NextResponse.json(
        { error: "Notificação não encontrada" },
        { status: 404 }
      )
    }

    await prisma.notificacao.delete({
      where: { id },
    })

    return NextResponse.json({
      message: "Notificação excluída com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir notificação:", error)
    return NextResponse.json(
      { error: "Erro ao excluir notificação" },
      { status: 500 }
    )
  }
}