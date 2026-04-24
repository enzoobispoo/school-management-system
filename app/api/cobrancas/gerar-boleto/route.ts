import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { createBoleto } from "@/lib/billing/provider";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { buildPaymentReminderMessage } from "@/lib/templates/payment-reminder";
import {
  CanalCobranca,
  StatusEnvioCobranca,
  TipoEnvioCobranca,
} from "@prisma/client";
import { createCobrancaEnvioLog } from "@/lib/services/cobranca-envio-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatDateToYMD(date: Date) {
  return date.toISOString().slice(0, 10);
}

function hasExistingBoleto(payment: {
  billingProvider: string | null;
  billingExternalId: string | null;
  billingInvoiceUrl: string | null;
  billingBankSlipUrl: string | null;
}) {
  return Boolean(
    payment.billingProvider &&
      payment.billingExternalId &&
      (payment.billingBankSlipUrl || payment.billingInvoiceUrl)
  );
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId } = body as { paymentId?: string };

    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId é obrigatório." },
        { status: 400 }
      );
    }

    const payment = await prisma.pagamento.findUnique({
      where: { id: paymentId },
      include: {
        matricula: {
          include: {
            aluno: true,
            turma: {
              include: {
                curso: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado." },
        { status: 404 }
      );
    }

    if (payment.status === "PAGO" || payment.dataPagamento) {
      return NextResponse.json(
        { error: "Não é possível gerar boleto para uma cobrança já paga." },
        { status: 400 }
      );
    }

    if (hasExistingBoleto(payment)) {
      return NextResponse.json({
        success: true,
        reused: true,
        message: "Este pagamento já possui um boleto gerado.",
        payment,
        boleto: {
          provider: payment.billingProvider,
          paymentId: payment.billingExternalId,
          invoiceUrl: payment.billingInvoiceUrl,
          bankSlipUrl: payment.billingBankSlipUrl,
          status: payment.billingStatus,
        },
      });
    }

    const aluno = payment.matricula.aluno;

    const school = await prisma.escolaSettings.findUnique({
      where: { id: "default" },
      select: {
        multaAtrasoPercentual: true,
        jurosMensalPercentual: true,
        autoSendBoletoWhatsApp: true,
      },
    });

    const boleto = await createBoleto({
      studentName: aluno.responsavelNome || aluno.nome,
      studentEmail: aluno.responsavelEmail || aluno.email,
      studentCpf: aluno.cpf,
      phone: aluno.responsavelTelefone || aluno.telefone,
      amount: Number(payment.valor),
      dueDate: formatDateToYMD(payment.vencimento),
      description: payment.descricao,
      externalReference: payment.id,
      interestPercentage: school?.jurosMensalPercentual
        ? Number(school.jurosMensalPercentual)
        : 0,
      finePercentage: school?.multaAtrasoPercentual
        ? Number(school.multaAtrasoPercentual)
        : 0,
    });


    if (!aluno.asaasCustomerId && boleto.customerId) {
      await prisma.aluno.update({
        where: { id: aluno.id },
        data: {
          asaasCustomerId: boleto.customerId,
        },
      });
    }

    const updatedPayment = await prisma.pagamento.update({
      where: { id: payment.id },
      data: {
        billingProvider: "asaas",
        billingExternalId: boleto.paymentId,
        billingInvoiceUrl: boleto.invoiceUrl,
        billingBankSlipUrl: boleto.bankSlipUrl,
        billingStatus: boleto.status,
        boletoGeradoEm: new Date(),
      },
    });

    if (school?.autoSendBoletoWhatsApp) {
      const destinoTelefone = aluno.responsavelTelefone || aluno.telefone;
      const boletoUrl = boleto.bankSlipUrl || boleto.invoiceUrl;

      if (destinoTelefone && boletoUrl) {
        const message = buildPaymentReminderMessage({
          name: aluno.responsavelNome || aluno.nome,
          amount: Number(payment.valor),
          competence: `${String(payment.competenciaMes).padStart(2, "0")}/${payment.competenciaAno}`,
          boletoUrl,
        });

        try {
          const result = await sendWhatsAppMessage({
            to: destinoTelefone,
            message,
          });

          await createCobrancaEnvioLog({
            pagamentoId: payment.id,
            canal: CanalCobranca.WHATSAPP,
            tipo: TipoEnvioCobranca.BOLETO,
            destino: destinoTelefone,
            status: StatusEnvioCobranca.ENVIADO,
            provedor: "twilio",
            externalId: result?.sid ?? null,
            mensagem: message,
          });
        } catch (error) {
          await createCobrancaEnvioLog({
            pagamentoId: payment.id,
            canal: CanalCobranca.WHATSAPP,
            tipo: TipoEnvioCobranca.BOLETO,
            destino: destinoTelefone,
            status: StatusEnvioCobranca.FALHO,
            provedor: "twilio",
            mensagem: message,
            erro:
              error instanceof Error ? error.message : "Erro ao enviar boleto por WhatsApp",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      reused: false,
      message: "Boleto gerado com sucesso.",
      payment: updatedPayment,
      boleto: {
        provider: "asaas",
        paymentId: boleto.paymentId,
        invoiceUrl: boleto.invoiceUrl,
        bankSlipUrl: boleto.bankSlipUrl,
        identificationField: boleto.identificationField,
        nossoNumero: boleto.nossoNumero,
        barCode: boleto.barCode,
        status: boleto.status,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar boleto:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível gerar o boleto.",
      },
      { status: 500 }
    );
  }
  
}