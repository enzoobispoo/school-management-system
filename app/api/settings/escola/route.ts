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
      ...settings,
      multaAtrasoPercentual: settings.multaAtrasoPercentual
        ? Number(settings.multaAtrasoPercentual)
        : null,
      jurosMensalPercentual: settings.jurosMensalPercentual
        ? Number(settings.jurosMensalPercentual)
        : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao carregar configurações da escola." },
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
        nomeEscola: body.nomeEscola,
        cnpj: body.cnpj,
        email: body.email,
        telefone: body.telefone,
        whatsapp: body.whatsapp,
        endereco: body.endereco,
        corPrimaria: body.corPrimaria,
        logoUrl: body.logoUrl,

        diaVencimentoPadrao: body.diaVencimentoPadrao,
        metodoPagamentoPadrao: body.metodoPagamentoPadrao,
        multaAtrasoPercentual: body.multaAtrasoPercentual,
        jurosMensalPercentual: body.jurosMensalPercentual,
        gerarMensalidadeAuto: body.gerarMensalidadeAuto,

        notificarNovoAluno: body.notificarNovoAluno,
        notificarPagamento: body.notificarPagamento,
        notificarAtraso: body.notificarAtraso,
        enviarLembreteAuto: body.enviarLembreteAuto,
        autoSendBoletoWhatsApp: body.autoSendBoletoWhatsApp,
        temaPadrao: body.temaPadrao,
        densidade: body.densidade,

        billingProvider: body.billingProvider,
        billingEnabled: body.billingEnabled,
        asaasApiKey: body.asaasApiKey,
        asaasWalletId: body.asaasWalletId,
        asaasEnvironment: body.asaasEnvironment,
        defaultChargeMethod: body.defaultChargeMethod,
        autoGenerateBoleto: body.autoGenerateBoleto,
      },
      create: {
        id: "default",
        nomeEscola: body.nomeEscola || "EduGestão",
        cnpj: body.cnpj,
        email: body.email,
        telefone: body.telefone,
        whatsapp: body.whatsapp,
        endereco: body.endereco,
        corPrimaria: body.corPrimaria || "#111111",
        logoUrl: body.logoUrl,

        diaVencimentoPadrao: body.diaVencimentoPadrao ?? 10,
        metodoPagamentoPadrao: body.metodoPagamentoPadrao,
        multaAtrasoPercentual: body.multaAtrasoPercentual,
        jurosMensalPercentual: body.jurosMensalPercentual,
        gerarMensalidadeAuto: body.gerarMensalidadeAuto ?? false,

        notificarNovoAluno: body.notificarNovoAluno ?? true,
        notificarPagamento: body.notificarPagamento ?? true,
        notificarAtraso: body.notificarAtraso ?? true,
        enviarLembreteAuto: body.enviarLembreteAuto ?? false,
        autoSendBoletoWhatsApp: body.autoSendBoletoWhatsApp ?? false,
        temaPadrao: body.temaPadrao ?? "light",
        densidade: body.densidade ?? "comfortable",

        billingProvider: body.billingProvider ?? "asaas",
        billingEnabled: body.billingEnabled ?? false,
        asaasApiKey: body.asaasApiKey,
        asaasWalletId: body.asaasWalletId,
        asaasEnvironment: body.asaasEnvironment ?? "sandbox",
        defaultChargeMethod: body.defaultChargeMethod ?? "boleto",
        autoGenerateBoleto: body.autoGenerateBoleto ?? false,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erro ao salvar configurações da escola:", error);

    return NextResponse.json(
      { error: "Erro ao salvar configurações da escola." },
      { status: 500 }
    );
  }
}