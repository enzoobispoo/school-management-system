import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const allowedRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "FINANCEIRO",
  "SECRETARIA",
  "PROFESSOR",
] as const;

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    if (currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const role =
      typeof body.role === "string" &&
      allowedRoles.includes(body.role as (typeof allowedRoles)[number])
        ? body.role
        : undefined;

    const ativo = typeof body.ativo === "boolean" ? body.ativo : undefined;

    if (role === undefined && ativo === undefined) {
      return NextResponse.json(
        { error: "Nenhuma alteração válida foi enviada." },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role !== undefined ? { role } : {}),
        ...(ativo !== undefined ? { ativo } : {}),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
      },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar usuário." },
      { status: 500 }
    );
  }
}