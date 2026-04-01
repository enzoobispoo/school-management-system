import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { getOrCreateSchoolSetting } from "@/lib/school";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado." },
        { status: 403 }
      );
    }

    const school = await getOrCreateSchoolSetting();

    return NextResponse.json({ school });
  } catch (error) {
    console.error("Erro ao buscar escola:", error);

    return NextResponse.json(
      { error: "Não foi possível carregar a escola." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const nome = String(body?.nome ?? "").trim();

    if (!nome) {
      return NextResponse.json(
        { error: "O nome da escola é obrigatório." },
        { status: 400 }
      );
    }

    const school = await prisma.schoolSetting.upsert({
      where: { id: "default" },
      update: { nome },
      create: {
        id: "default",
        nome,
      },
    });

    return NextResponse.json({
      success: true,
      school,
    });
  } catch (error) {
    console.error("Erro ao salvar escola:", error);

    return NextResponse.json(
      { error: "Não foi possível salvar o nome da escola." },
      { status: 500 }
    );
  }
}