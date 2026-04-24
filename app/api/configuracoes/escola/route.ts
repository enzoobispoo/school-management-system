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

    const nomeEscola = String(body?.nomeEscola ?? "").trim();
    const billingProvider = String(body?.billingProvider ?? "asaas").trim();
    const billingEnabled = Boolean(body?.billingEnabled);
    const asaasApiKey = body?.asaasApiKey
      ? String(body.asaasApiKey).trim()
      : null;
    const asaasWalletId = body?.asaasWalletId
      ? String(body.asaasWalletId).trim()
      : null;
    const asaasEnvironment = String(
      body?.asaasEnvironment ?? "sandbox"
    ).trim();
    const defaultChargeMethod = String(
      body?.defaultChargeMethod ?? "boleto"
    ).trim();
    const autoGenerateBoleto = Boolean(body?.autoGenerateBoleto);

    if (!nomeEscola) {
      return NextResponse.json(
        { error: "O nome da escola é obrigatório." },
        { status: 400 }
      );
    }

    const school = await prisma.escolaSettings.upsert({
      where: { id: "default" },
      update: {
        nomeEscola,
        billingProvider,
        billingEnabled,
        asaasApiKey,
        asaasWalletId,
        asaasEnvironment,
        defaultChargeMethod,
        autoGenerateBoleto,
      },
      create: {
        id: "default",
        nomeEscola,
        billingProvider,
        billingEnabled,
        asaasApiKey,
        asaasWalletId,
        asaasEnvironment,
        defaultChargeMethod,
        autoGenerateBoleto,
      },
    });

    return NextResponse.json({
      success: true,
      school,
    });
  } catch (error) {
    console.error("Erro ao salvar escola:", error);

    return NextResponse.json(
      { error: "Não foi possível salvar as configurações da escola." },
      { status: 500 }
    );
  }
}