import { NextResponse } from "next/server";
import { getOrCreateSchoolSetting } from "@/lib/school";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const school = await getOrCreateSchoolSetting();

    return NextResponse.json({
      nome: school.nome,
    });
  } catch (error) {
    console.error("Erro ao buscar nome da escola:", error);

    return NextResponse.json(
      { error: "Não foi possível carregar o nome da escola." },
      { status: 500 }
    );
  }
}