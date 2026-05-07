import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateNotificacaoSchema } from "@/lib/validations/notificacao"
import { getCurrentUser, requireSchool } from "@/lib/auth";
import { enrichNotificationWithLinkHref } from "@/lib/notificacoes/enrich-notification-link";
import { buildScopedNotificationWhere } from "@/lib/notificacoes/scoped-notification-where";

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;
    const { id } = await context.params

    const scopeWhere = await buildScopedNotificationWhere({
      schoolId,
      role: user.role,
      professorId: user.professorId ?? null,
      userId: user.id,
    });

    const notificacao = await prisma.notificacao.findFirst({
      where: { AND: [{ id }, scopeWhere] },
    })

    if (!notificacao) {
      return NextResponse.json(
        { error: "Notificação não encontrada" },
        { status: 404 }
      )
    }

    const payload = await enrichNotificationWithLinkHref(notificacao, schoolId);
    return NextResponse.json(payload)
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
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;
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

    const scopeWhere = await buildScopedNotificationWhere({
      schoolId,
      role: user.role,
      professorId: user.professorId ?? null,
      userId: user.id,
    });

    const notificacaoExistente = await prisma.notificacao.findFirst({
      where: { AND: [{ id }, scopeWhere] },
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

    const payload = await enrichNotificationWithLinkHref(notificacao, schoolId)
    return NextResponse.json(payload)
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
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;
    const { id } = await context.params

    const scopeWhere = await buildScopedNotificationWhere({
      schoolId,
      role: user.role,
      professorId: user.professorId ?? null,
      userId: user.id,
    });

    const notificacao = await prisma.notificacao.findFirst({
      where: { AND: [{ id }, scopeWhere] },
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