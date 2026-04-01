import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        ativo: user.ativo,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar usuário autenticado:", error);

    return NextResponse.json(
      { error: "Não foi possível carregar o usuário." },
      { status: 500 }
    );
  }
}