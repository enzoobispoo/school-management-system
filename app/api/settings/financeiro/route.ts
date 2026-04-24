import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    let settings = await prisma.escolaSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.escolaSettings.create({
        data: {
          id: "default",
          nomeEscola: "EduGestão",
        },
      });
    }

    return NextResponse.json({
      diaVencimentoPadrao: settings.diaVencimentoPadrao,
      multaAtrasoPercentual: settings.multaAtrasoPercentual
        ? Number(settings.multaAtrasoPercentual)
        : 0,
      jurosMensalPercentual: settings.jurosMensalPercentual
        ? Number(settings.jurosMensalPercentual)
        : 0,
      gerarMensalidadeAuto: settings.gerarMensalidadeAuto,
      metodoPagamentoPadrao: settings.metodoPagamentoPadrao,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao carregar configurações financeiras." },
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

    const settings = await prisma.escolaSettings.upsert({
      where: { id: "default" },
      update: {
        diaVencimentoPadrao: body.diaVencimentoPadrao,
        multaAtrasoPercentual: body.multaAtrasoPercentual,
        jurosMensalPercentual: body.jurosMensalPercentual,
        gerarMensalidadeAuto: body.gerarMensalidadeAuto,
        metodoPagamentoPadrao: body.metodoPagamentoPadrao,
      },
      create: {
        id: "default",
        nomeEscola: "EduGestão",
        diaVencimentoPadrao: body.diaVencimentoPadrao,
        multaAtrasoPercentual: body.multaAtrasoPercentual,
        jurosMensalPercentual: body.jurosMensalPercentual,
        gerarMensalidadeAuto: body.gerarMensalidadeAuto,
        metodoPagamentoPadrao: body.metodoPagamentoPadrao,
      },
    });

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(
      { error: "Erro ao salvar configurações financeiras." },
      { status: 500 }
    );
  }
}