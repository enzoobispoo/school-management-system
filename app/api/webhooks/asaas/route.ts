import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  EntidadeNotificacao,
  StatusPagamento,
  TipoNotificacao,
} from "@prisma/client";
import { logFinanceAuditEvent } from "@/lib/services/finance-audit";
import { readCorrelationIdFromRequest } from "@/lib/observability/correlation";
import { logStructured } from "@/lib/observability/logger";
import { revalidateTag } from "next/cache";

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
  const correlationId = readCorrelationIdFromRequest(request);
  try {
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN?.trim();

    if (!expectedToken) {
      logStructured("error", {
        event: "asaas_webhook_config_missing",
        correlationId,
      });
      return NextResponse.json(
        { error: "Webhook não configurado." },
        { status: 500 }
      );
    }

    const receivedToken =
      request.headers.get("asaas-access-token")?.trim() || "";

    if (!receivedToken || !safeEqual(receivedToken, expectedToken)) {
      logStructured("warn", {
        event: "asaas_webhook_unauthorized",
        correlationId,
      });
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

    logStructured("info", {
      event: "asaas_webhook_received",
      correlationId,
      asaasEvent: body.event ?? null,
      paymentId: paymentId ?? null,
    });

    if (!paymentId) {
      return NextResponse.json(
        { error: "Webhook sem payment.id" },
        { status: 400 }
      );
    }

    const externalReference = body.payment?.externalReference;
    const pagamento = await prisma.pagamento.findFirst({
      where: {
        OR: [
          { billingExternalId: paymentId },
          ...(externalReference ? [{ id: externalReference }] : []),
        ],
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
      logStructured("info", {
        event: "asaas_webhook_payment_not_found",
        correlationId,
        paymentId,
      });
      return NextResponse.json({
        success: true,
        ignored: true,
        message: "Pagamento não encontrado.",
      });
    }

    logStructured("info", {
      event: "asaas_webhook_payment_resolved",
      correlationId,
      schoolId: pagamento.schoolId,
      pagamentoId: pagamento.id,
      statusIncoming: asaasStatus ?? null,
    });

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

    const nextPaymentDate = dataToUpdate.dataPagamento ?? null;
    const sameStatusAlreadyApplied =
      pagamento.billingStatus === (asaasStatus || null) &&
      (!mappedStatus || pagamento.status === mappedStatus) &&
      ((pagamento.dataPagamento?.getTime() ?? null) ===
        (nextPaymentDate ? nextPaymentDate.getTime() : null)) &&
      (pagamento.billingInvoiceUrl ?? null) ===
        (body.payment?.invoiceUrl || pagamento.billingInvoiceUrl || null) &&
      (pagamento.billingBankSlipUrl ?? null) ===
        (body.payment?.bankSlipUrl || pagamento.billingBankSlipUrl || null);

    if (sameStatusAlreadyApplied) {
      await logFinanceAuditEvent({
        schoolId: pagamento.schoolId,
        eventType: "ASAAS_WEBHOOK_DUPLICATE",
        source: "webhook",
        status: "ignored",
        referenceId: pagamento.id,
        message: "Evento do Asaas recebido sem alterações efetivas.",
        payload: {
          paymentId,
          asaasStatus,
          externalReference: body.payment?.externalReference ?? null,
        },
      });
      return NextResponse.json({
        success: true,
        ignored: true,
        message: "Evento já aplicado anteriormente.",
        pagamentoId: pagamento.id,
      });
    }

    const updated = await prisma.pagamento.update({
      where: { id: pagamento.id },
      data: dataToUpdate,
    });

    try {
      revalidateTag(`school-dashboard-${pagamento.schoolId}`, "max");
    } catch {
      // Next cache pode não estar disponível em todos os runtimes de teste
    }

    await logFinanceAuditEvent({
      schoolId: pagamento.schoolId,
      eventType: "ASAAS_WEBHOOK_PROCESSED",
      source: "webhook",
      status: "success",
      referenceId: pagamento.id,
      message: `Webhook Asaas aplicado com status ${asaasStatus ?? "desconhecido"}.`,
      payload: {
        paymentId,
        externalReference: body.payment?.externalReference ?? null,
        localStatus: updated.status,
      },
    });

    if (mappedStatus === StatusPagamento.PAGO) {
      await prisma.notificacao.create({
        data: {
          schoolId: pagamento.schoolId,
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
    logStructured("error", {
      event: "asaas_webhook_failed",
      correlationId,
      message:
        error instanceof Error
          ? error.message
          : "Erro ao processar webhook do Asaas.",
    });

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