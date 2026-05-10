import { NextRequest, NextResponse } from "next/server";
import { executePaymentReminderWhatsApp } from "@/lib/automation/payment-reminder-whatsapp";
import {
  assertBillingNotify,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const denied = assertBillingNotify(user);
    if (denied) return denied;

    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId é obrigatório" },
        { status: 400 }
      );
    }

    try {
      const result = await executePaymentReminderWhatsApp({
        schoolId,
        tenantId: schoolId,
        paymentId,
        triggeredByUserId: user.id,
        skipCooldown: false,
      });

      return NextResponse.json({
        success: true,
        hasBoletoLink: result.hasBoletoLink,
        twilioSid: result.twilioSid,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";

      if (msg === "COOLDOWN_24H") {
        return NextResponse.json(
          {
            error:
              "Já foi enviado um lembrete para este pagamento nas últimas 24 horas.",
          },
          { status: 409 }
        );
      }

      if (msg === "PAGAMENTO_NOT_FOUND") {
        return NextResponse.json(
          { error: "Pagamento não encontrado" },
          { status: 404 }
        );
      }

      if (msg === "TELEFONE_RESPONSAVEL_AUSENTE") {
        return NextResponse.json(
          {
            error:
              "O aluno não possui telefone do responsável nem telefone próprio cadastrado.",
          },
          { status: 400 }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error("Erro ao enviar cobrança:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao enviar cobrança",
      },
      { status: 500 }
    );
  }
}
