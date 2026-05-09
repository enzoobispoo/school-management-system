import { NextRequest, NextResponse } from "next/server"
import { Prisma, TipoNotificacao } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import {
  createNotificacaoSchema,
  markAllAsReadSchema,
} from "@/lib/validations/notificacao"
import { getCurrentUser, requireSchool } from "@/lib/auth"
import { enrichNotificationsWithLinkHref } from "@/lib/notificacoes/enrich-notification-link"
import { buildScopedNotificationWhere } from "@/lib/notificacoes/scoped-notification-where"
import {
  isPrismaSchemaDriftError,
  PRISMA_MIGRATE_HINT_PT,
} from "@/lib/prisma/known-request"
import { blockProfessorWhenPortalDisabled } from "@/lib/docente/professor-portal-policy"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const portalDenied = await blockProfessorWhenPortalDisabled(user);
    if (portalDenied) return portalDenied;

    const { searchParams } = new URL(request.url)

    const lida = searchParams.get("lida")
    const tipo = searchParams.get("tipo")?.trim() || ""
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") || "20"), 1),
      100
    )
    const page = Math.max(Number(searchParams.get("page") || "1"), 1)

    const scopeWhere = await buildScopedNotificationWhere({
      schoolId,
      role: user.role,
      professorId: user.professorId ?? null,
      userId: user.id,
    })

    const filterWhere: Prisma.NotificacaoWhereInput = {
      ...(lida !== null ? { lida: lida === "true" } : {}),
      ...(tipo ? { tipo: tipo as TipoNotificacao } : {}),
    }

    const where: Prisma.NotificacaoWhereInput = {
      AND: [scopeWhere, filterWhere],
    }

    const [total, unreadCount, notificacoes] = await Promise.all([
      prisma.notificacao.count({ where }),
      prisma.notificacao.count({
        where: { AND: [scopeWhere, { lida: false }] },
      }),
      prisma.notificacao.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    const data = await enrichNotificationsWithLinkHref(notificacoes, schoolId);

    return NextResponse.json({
      data,
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
    if (isPrismaSchemaDriftError(error)) {
      return NextResponse.json(
        { error: PRISMA_MIGRATE_HINT_PT },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: "Erro ao buscar notificações" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const portalDeniedPost = await blockProfessorWhenPortalDisabled(user);
    if (portalDeniedPost) return portalDeniedPost;

    const body = await request.json()

    const markAllParsed = markAllAsReadSchema.safeParse(body)

    if (markAllParsed.success) {
      const scopeWhere = await buildScopedNotificationWhere({
        schoolId,
        role: user.role,
        professorId: user.professorId ?? null,
        userId: user.id,
      })
      const result = await prisma.notificacao.updateMany({
        where: { AND: [scopeWhere, { lida: false }] },
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
      data: { ...parsed.data, schoolId },
    })

    return NextResponse.json(notificacao, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar/atualizar notificações:", error)
    if (isPrismaSchemaDriftError(error)) {
      return NextResponse.json(
        { error: PRISMA_MIGRATE_HINT_PT },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: "Erro ao processar notificações" },
      { status: 500 }
    )
  }
}