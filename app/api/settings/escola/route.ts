import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";
import {
  normalizePlanTier,
  planAllowsBillingProviderChoice,
} from "@/lib/school-plan";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const result = requireSchool(user);
    if (result instanceof NextResponse) return result;
    const { schoolId } = result;

    const [school, settingsRow] = await Promise.all([
      prisma.school.findUnique({ where: { id: schoolId }, select: { plano: true } }),
      prisma.escolaSettings.findUnique({ where: { schoolId } }),
    ]);

    let settings = settingsRow;
    if (!settings) {
      settings = await prisma.escolaSettings.create({
        data: { id: schoolId, schoolId, nomeEscola: "Minha Escola" },
      });
    }

    const tier = normalizePlanTier(school?.plano);

    return NextResponse.json({
      ...settings,
      multaAtrasoPercentual: settings.multaAtrasoPercentual ? Number(settings.multaAtrasoPercentual) : null,
      jurosMensalPercentual: settings.jurosMensalPercentual ? Number(settings.jurosMensalPercentual) : null,
      planTier: tier,
      billingProviderLocked: !planAllowsBillingProviderChoice(tier),
    });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar configurações da escola." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const result = requireSchool(user);
    if (result instanceof NextResponse) return result;
    const { schoolId } = result;

    const body = await request.json();

    const schoolRow = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { plano: true },
    });
    const tier = normalizePlanTier(schoolRow?.plano);
    const billingProvider =
      planAllowsBillingProviderChoice(tier) && typeof body.billingProvider === "string"
        ? body.billingProvider
        : "asaas";

    const settings = await prisma.escolaSettings.upsert({
      where: { schoolId },
      update: {
        nomeEscola: body.nomeEscola, cnpj: body.cnpj, email: body.email,
        telefone: body.telefone, whatsapp: body.whatsapp, endereco: body.endereco,
        corPrimaria: body.corPrimaria, logoUrl: body.logoUrl,
        diaVencimentoPadrao: body.diaVencimentoPadrao, metodoPagamentoPadrao: body.metodoPagamentoPadrao,
        multaAtrasoPercentual: body.multaAtrasoPercentual, jurosMensalPercentual: body.jurosMensalPercentual,
        gerarMensalidadeAuto: body.gerarMensalidadeAuto,
        notificarNovoAluno: body.notificarNovoAluno, notificarPagamento: body.notificarPagamento,
        notificarAtraso: body.notificarAtraso, enviarLembreteAuto: body.enviarLembreteAuto,
        autoSendBoletoWhatsApp: body.autoSendBoletoWhatsApp,
        temaPadrao: body.temaPadrao, densidade: body.densidade,
        billingProvider,
        billingEnabled: body.billingEnabled,
        asaasApiKey: body.asaasApiKey, asaasWalletId: body.asaasWalletId,
        asaasEnvironment: body.asaasEnvironment, defaultChargeMethod: body.defaultChargeMethod,
        autoGenerateBoleto: body.autoGenerateBoleto,
      },
      create: {
        id: schoolId, schoolId, nomeEscola: body.nomeEscola || "Minha Escola",
        cnpj: body.cnpj, email: body.email, telefone: body.telefone,
        whatsapp: body.whatsapp, endereco: body.endereco,
        corPrimaria: body.corPrimaria || "#111111", logoUrl: body.logoUrl,
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
        temaPadrao: body.temaPadrao ?? "light", densidade: body.densidade ?? "comfortable",
        billingProvider,
        billingEnabled: body.billingEnabled ?? false,
        asaasApiKey: body.asaasApiKey, asaasWalletId: body.asaasWalletId,
        asaasEnvironment: body.asaasEnvironment ?? "sandbox",
        defaultChargeMethod: body.defaultChargeMethod ?? "boleto",
        autoGenerateBoleto: body.autoGenerateBoleto ?? false,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erro ao salvar configurações da escola:", error);
    return NextResponse.json({ error: "Erro ao salvar configurações da escola." }, { status: 500 });
  }
}
