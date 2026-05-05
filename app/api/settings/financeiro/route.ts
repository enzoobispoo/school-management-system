import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const result = requireSchool(user);
    if (result instanceof NextResponse) return result;
    const { schoolId } = result;

    let settings = await prisma.escolaSettings.findUnique({ where: { schoolId } });
    if (!settings) {
      settings = await prisma.escolaSettings.create({
        data: { id: schoolId, schoolId, nomeEscola: "Minha Escola" },
      });
    }

    return NextResponse.json({
      diaVencimentoPadrao: settings.diaVencimentoPadrao,
      multaAtrasoPercentual: settings.multaAtrasoPercentual ? Number(settings.multaAtrasoPercentual) : 0,
      jurosMensalPercentual: settings.jurosMensalPercentual ? Number(settings.jurosMensalPercentual) : 0,
      gerarMensalidadeAuto: settings.gerarMensalidadeAuto,
      metodoPagamentoPadrao: settings.metodoPagamentoPadrao,
      metaMensal: settings.metaMensal ? Number(settings.metaMensal) : 0,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar configurações financeiras." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const result = requireSchool(user);
    if (result instanceof NextResponse) return result;
    const { schoolId } = result;

    const body = await request.json();

    const settings = await prisma.escolaSettings.upsert({
      where: { schoolId },
      update: {
        diaVencimentoPadrao: body.diaVencimentoPadrao,
        multaAtrasoPercentual: body.multaAtrasoPercentual,
        jurosMensalPercentual: body.jurosMensalPercentual,
        gerarMensalidadeAuto: body.gerarMensalidadeAuto,
        metodoPagamentoPadrao: body.metodoPagamentoPadrao,
        metaMensal: body.metaMensal ?? null,
      },
      create: {
        id: schoolId, schoolId, nomeEscola: "Minha Escola",
        diaVencimentoPadrao: body.diaVencimentoPadrao,
        multaAtrasoPercentual: body.multaAtrasoPercentual,
        jurosMensalPercentual: body.jurosMensalPercentual,
        gerarMensalidadeAuto: body.gerarMensalidadeAuto,
        metodoPagamentoPadrao: body.metodoPagamentoPadrao,
        metaMensal: body.metaMensal ?? null,
      },
    });

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "Erro ao salvar configurações financeiras." }, { status: 500 });
  }
}
