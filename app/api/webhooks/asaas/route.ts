import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  EntidadeNotificacao,
  StatusPagamento,
  TipoNotificacao,
} from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AsaasWebhookPayload = {
  event?: string;
  payment?: {
    id?: string;
    status?: string;
    value?: number;
    netValue?: number;
    originalValue?: number;
    billingType?: string;
    dueDate?: string;
    paymentDate?: string;
    clientPaymentDate?: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
    externalReference?: string;
  };
};

function mapAsaasStatusToLocalStatus(
  status?: string
): StatusPagamento | null {
  if (!status) return null;

  switch (status) {
    case "RECEIVED":
    case "RECEIVED_IN_CASH":
    case "CONFIRMED":
      return StatusPagamento.PAGO;

    case "OVERDUE":
      return StatusPagamento.ATRASADO;

    case "PENDING":
      return StatusPagamento.PENDENTE;

    case "REFUNDED":
    case "REFUND_REQUESTED":
    case "CHARGEBACK_REQUESTED":
    case "CHARGEBACK_DISPUTE":
    case "AWAITING_CHARGEBACK_REVERSAL":
    case "DUNNING_REQUESTED":
      return StatusPagamento.PENDENTE;

    default:
      return null;
  }
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

export async function POST(request: NextRequest) {
  try {
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN?.trim();

    if (!expectedToken) {
      console.error("ASAAS_WEBHOOK_TOKEN não configurado.");
      return NextResponse.json(
        { error: "Webhook não configurado." },
        { status: 500 }
      );
    }

    const receivedToken =
      request.headers.get("asaas-access-token")?.trim() || "";

    if (!receivedToken || !safeEqual(receivedToken, expectedToken)) {
      return NextResponse.json(
        { error: "Token de webhook inválido." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as AsaasWebhookPayload;

    const paymentId = body.payment?.id;
    const asaasStatus = body.payment?.status;
    const paymentDate =
      body.payment?.paymentDate || body.payment?.clientPaymentDate || null;

    if (!paymentId) {
      return NextResponse.json(
        { error: "Webhook sem payment.id" },
        { status: 400 }
      );
    }

    const pagamento = await prisma.pagamento.findFirst({
      where: {
        billingExternalId: paymentId,
      },
      include: {
        matricula: {
          include: {
            aluno: true,
          },
        },
      },
    });

    if (!pagamento) {
      return NextResponse.json({
        success: true,
        ignored: true,
        message: "Pagamento não encontrado.",
      });
    }

    const mappedStatus = mapAsaasStatusToLocalStatus(asaasStatus);

    const dataToUpdate: {
      billingStatus?: string | null;
      status?: StatusPagamento;
      dataPagamento?: Date | null;
      billingInvoiceUrl?: string | null;
      billingBankSlipUrl?: string | null;
    } = {
      billingStatus: asaasStatus || null,
      billingInvoiceUrl:
        body.payment?.invoiceUrl || pagamento.billingInvoiceUrl,
      billingBankSlipUrl:
        body.payment?.bankSlipUrl || pagamento.billingBankSlipUrl,
    };

    if (mappedStatus) {
      dataToUpdate.status = mappedStatus;
    }

    if (mappedStatus === StatusPagamento.PAGO) {
      dataToUpdate.dataPagamento = paymentDate
        ? new Date(paymentDate)
        : new Date();
    }

    const updated = await prisma.pagamento.update({
      where: { id: pagamento.id },
      data: dataToUpdate,
    });

    if (mappedStatus === StatusPagamento.PAGO) {
      await prisma.notificacao.create({
        data: {
          tipo: TipoNotificacao.PAGAMENTO_CONFIRMADO,
          titulo: "Pagamento confirmado",
          mensagem: `${pagamento.matricula.aluno.nome} teve um pagamento confirmado automaticamente via Asaas.`,
          entidadeTipo: EntidadeNotificacao.PAGAMENTO,
          entidadeId: pagamento.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      pagamentoId: updated.id,
      billingExternalId: paymentId,
      billingStatus: asaasStatus,
      localStatus: updated.status,
    });
  } catch (error) {
    console.error("Erro no webhook do Asaas:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao processar webhook do Asaas.",
      },
      { status: 500 }
    );
  }
}