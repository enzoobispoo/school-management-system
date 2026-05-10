import "server-only";

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { buildPaymentReminderMessage } from "@/lib/templates/payment-reminder";
import {
  CanalCobranca,
  StatusEnvioCobranca,
  TipoEnvioCobranca,
} from "@prisma/client";
import { createCobrancaEnvioLog } from "@/lib/services/cobranca-envio-log";

function formatCompetence(month: number, year: number) {
  return `${String(month).padStart(2, "0")}/${year}`;
}

function cobrancaFromEmail() {
  const from =
    process.env.COBRANCA_FROM_EMAIL?.trim() ||
    process.env.INVITE_FROM_EMAIL?.trim();
  if (!from) {
    throw new Error(
      "Defina COBRANCA_FROM_EMAIL ou INVITE_FROM_EMAIL para envio de cobrança."
    );
  }
  return from;
}

export type PaymentReminderEmailParams = {
  schoolId: string;
  paymentId: string;
};

/**
 * E-mail de lembrete de mensalidade via Resend (texto alinhado ao template do WhatsApp).
 */
export async function sendPaymentReminderEmail(
  params: PaymentReminderEmailParams
) {
  if (!process.env.RESEND_API_KEY?.trim()) {
    throw new Error("RESEND_API_KEY não configurada.");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = cobrancaFromEmail();

  const pagamento = await prisma.pagamento.findFirst({
    where: { id: params.paymentId, schoolId: params.schoolId },
    include: {
      matricula: {
        include: { aluno: true },
      },
    },
  });

  if (!pagamento) {
    throw new Error("PAGAMENTO_NOT_FOUND");
  }

  const aluno = pagamento.matricula.aluno;
  const to =
    aluno.responsavelEmail?.trim() || aluno.email?.trim() || null;

  if (!to) {
    throw new Error("EMAIL_RESPONSAVEL_AUSENTE");
  }

  const boletoUrl =
    pagamento.billingBankSlipUrl || pagamento.billingInvoiceUrl || null;

  const bodyText = buildPaymentReminderMessage({
    name: aluno.responsavelNome || aluno.nome,
    amount: Number(pagamento.valor),
    competence: formatCompetence(
      pagamento.competenciaMes,
      pagamento.competenciaAno
    ),
    boletoUrl,
  });

  const nomeEscola =
    (
      await prisma.escolaSettings.findUnique({
        where: { schoolId: params.schoolId },
        select: { nomeEscola: true },
      })
    )?.nomeEscola?.trim() || "Escola";

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject: `${nomeEscola} — lembrete de pagamento (${formatCompetence(
        pagamento.competenciaMes,
        pagamento.competenciaAno
      )})`,
      text: bodyText,
    });

    const externalId = result.data?.id ?? null;

    await createCobrancaEnvioLog({
      pagamentoId: pagamento.id,
      canal: CanalCobranca.EMAIL,
      tipo: TipoEnvioCobranca.LEMBRETE,
      destino: to,
      status: StatusEnvioCobranca.ENVIADO,
      provedor: "resend",
      externalId,
      mensagem: bodyText.slice(0, 4000),
    });

    return { ok: true as const, resendId: externalId, destino: to };
  } catch (error) {
    await createCobrancaEnvioLog({
      pagamentoId: pagamento.id,
      canal: CanalCobranca.EMAIL,
      tipo: TipoEnvioCobranca.LEMBRETE,
      destino: to,
      status: StatusEnvioCobranca.FALHO,
      provedor: "resend",
      mensagem: bodyText.slice(0, 4000),
      erro: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
