import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const schools = await prisma.school.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nome: true,
        slug: true,
        email: true,
        plano: true,
        ativo: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            alunos: true,
            matriculas: true,
          },
        },
      },
    });

    return NextResponse.json({ data: schools, total: schools.length });
  } catch (error) {
    console.error("Erro ao listar escolas:", error);
    return NextResponse.json({ error: "Erro ao listar escolas." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const body = await request.json();
    const { id, ativo, plano } = body;

    if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

    const school = await prisma.school.update({
      where: { id },
      data: {
        ...(typeof ativo === "boolean" ? { ativo } : {}),
        ...(plano ? { plano } : {}),
      },
      select: { id: true, nome: true, ativo: true, plano: true },
    });

    return NextResponse.json(school);
  } catch (error) {
    console.error("Erro ao atualizar escola:", error);
    return NextResponse.json({ error: "Erro ao atualizar escola." }, { status: 500 });
  }
}
