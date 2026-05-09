import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { buildPaymentReminderMessage } from "@/lib/templates/payment-reminder";
import {
  assertBillingNotify,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";
import { logSchoolAudit } from "@/lib/audit/school-audit-log";
import {
  CanalCobranca,
  StatusEnvioCobranca,
  TipoEnvioCobranca,
} from "@prisma/client";
import { createCobrancaEnvioLog } from "@/lib/services/cobranca-envio-log";
import { canSendCobranca } from "@/lib/services/cobranca-cooldown";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatCompetence(month: number, year: number) {
  return `${String(month).padStart(2, "0")}/${year}`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const denied = assertBillingNotify(user);
    if (denied) return denied;

    const body = await request.json();
    const { paymentIds } = body as { paymentIds?: string[] };

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json(
        { error: "paymentIds é obrigatório." },
        { status: 400 }
      );
    }

    const pagamentos = await prisma.pagamento.findMany({
      where: {
        id: {
          in: paymentIds,
        },
        schoolId,
      },
      include: {
        matricula: {
          include: {
            aluno: true,
          },
        },
      },
    });

    if (pagamentos.length === 0) {
      return NextResponse.json(
        { error: "Nenhum pagamento encontrado." },
        { status: 404 }
      );
    }

    if (pagamentos.length !== paymentIds.length) {
      return NextResponse.json(
        { error: "Alguns pagamentos não pertencem à sua escola ou não existem." },
        { status: 400 }
      );
    }

    let sentCount = 0;
    let sentWithBoletoCount = 0;
    const skipped: string[] = [];

    for (const pagamento of pagamentos) {
      const aluno = pagamento.matricula.aluno;
      const destinoTelefone = aluno.responsavelTelefone || aluno.telefone;

      if (!destinoTelefone) {
        skipped.push(`${aluno.nome} (sem telefone do responsável/aluno)`);
        continue;
      }

      const ultimoEnvio = await prisma.cobrancaEnvio.findFirst({
        where: {
          pagamentoId: pagamento.id,
          canal: CanalCobranca.WHATSAPP,
          tipo: TipoEnvioCobranca.LEMBRETE,
          status: StatusEnvioCobranca.ENVIADO,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const cooldown = canSendCobranca(
        TipoEnvioCobranca.LEMBRETE,
        ultimoEnvio
      );

      if (!cooldown.allowed) {
        skipped.push(
          `${aluno.nome} (lembrete já enviado recentemente - aguarde ${cooldown.remainingHours}h)`
        );
        continue;
      }

      const boletoUrl =
        pagamento.billingBankSlipUrl || pagamento.billingInvoiceUrl || null;

      const message = buildPaymentReminderMessage({
        name: aluno.responsavelNome || aluno.nome,
        amount: Number(pagamento.valor),
        competence: formatCompetence(
          pagamento.competenciaMes,
          pagamento.competenciaAno
        ),
        boletoUrl,
      });

      try {
        const result = await sendWhatsAppMessage({
          to: destinoTelefone,
          message,
          schoolId,
        });

        await createCobrancaEnvioLog({
          pagamentoId: pagamento.id,
          canal: CanalCobranca.WHATSAPP,
          tipo: TipoEnvioCobranca.LEMBRETE,
          destino: destinoTelefone,
          status: StatusEnvioCobranca.ENVIADO,
          provedor: "twilio",
          externalId: result?.sid ?? null,
          mensagem: message,
        });

        sentCount += 1;

        if (boletoUrl) {
          sentWithBoletoCount += 1;
        }
      } catch (error) {
        await createCobrancaEnvioLog({
          pagamentoId: pagamento.id,
          canal: CanalCobranca.WHATSAPP,
          tipo: TipoEnvioCobranca.LEMBRETE,
          destino: destinoTelefone,
          status: StatusEnvioCobranca.FALHO,
          provedor: "twilio",
          mensagem: message,
          erro:
            error instanceof Error
              ? error.message
              : "Erro ao enviar cobrança em lote",
        });

        skipped.push(`${aluno.nome} (falha no envio)`);
      }
    }

    void logSchoolAudit({
      schoolId,
      userId: user.id,
      role: user.role,
      domain: "finance",
      action: "PAYMENT_REMINDER_BATCH",
      resourceId: null,
      summary: `Lembretes em lote: ${sentCount} enviados (${paymentIds.length} selecionados).`,
      payload: {
        sentCount,
        sentWithBoletoCount,
        selected: paymentIds.length,
      },
    });

    return NextResponse.json({
      success: true,
      sentCount,
      sentWithBoletoCount,
      skipped,
      message: `Cobrança enviada para ${sentCount} aluno(s).`,
    });
  } catch (error) {
    console.error("Erro ao enviar cobranças em lote:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar as cobranças em lote.",
      },
      { status: 500 }
    );
  }
}