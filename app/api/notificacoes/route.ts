import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import {
  createNotificacaoSchema,
  markAllAsReadSchema,
} from "@/lib/validations/notificacao"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const lida = searchParams.get("lida")
    const tipo = searchParams.get("tipo")?.trim() || ""
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") || "20"), 1),
      100
    )
    const page = Math.max(Number(searchParams.get("page") || "1"), 1)

    const where: Prisma.NotificacaoWhereInput = {
      ...(lida !== null ? { lida: lida === "true" } : {}),
      ...(tipo ? { tipo: tipo as never } : {}),
    }

    const [total, unreadCount, notificacoes] = await Promise.all([
      prisma.notificacao.count({ where }),
      prisma.notificacao.count({
        where: { lida: false },
      }),
      prisma.notificacao.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return NextResponse.json({
      data: notificacoes,
      meta: {
        total,
        unreadCount,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Erro ao buscar notificações:", error)
    return NextResponse.json(
      { error: "Erro ao buscar notificações" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const markAllParsed = markAllAsReadSchema.safeParse(body)

    if (markAllParsed.success) {
      const result = await prisma.notificacao.updateMany({
        where: { lida: false },
        data: { lida: true },
      })

      return NextResponse.json({
        message: "Todas as notificações foram marcadas como lidas",
        updatedCount: result.count,
      })
    }

    const parsed = createNotificacaoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const notificacao = await prisma.notificacao.create({
      data: parsed.data,
    })

    return NextResponse.json(notificacao, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar/atualizar notificações:", error)
    return NextResponse.json(
      { error: "Erro ao processar notificações" },
      { status: 500 }
    )
  }
}