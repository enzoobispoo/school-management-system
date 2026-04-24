import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        nome: true,
        email: true,
        telefone: true,
      },
    });

    return NextResponse.json(currentUser);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao carregar conta." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        nome: body.nome,
        email: body.email,
        telefone: body.telefone,
      },
      select: {
        nome: true,
        email: true,
        telefone: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao salvar conta." },
      { status: 500 }
    );
  }
}