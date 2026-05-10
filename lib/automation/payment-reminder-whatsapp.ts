import "server-only";

import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { buildPaymentReminderMessage } from "@/lib/templates/payment-reminder";
import {
  CanalCobranca,
  StatusEnvioCobranca,
  TipoEnvioCobranca,
} from "@prisma/client";
import { createCobrancaEnvioLog } from "@/lib/services/cobranca-envio-log";
import { logSchoolAudit } from "@/lib/audit/school-audit-log";

function formatCompetence(month: number, year: number) {
  return `${String(month).padStart(2, "0")}/${year}`;
}

function canSendReminder(
  ultimoEnvio?: {
    createdAt: Date;
    status: StatusEnvioCobranca;
  } | null
) {
  if (!ultimoEnvio) return true;
  const agora = new Date();
  const ultimoEnvioAt = new Date(ultimoEnvio.createdAt);
  const diffHours =
    (agora.getTime() - ultimoEnvioAt.getTime()) / (1000 * 60 * 60);
  return diffHours >= 24;
}

export type PaymentReminderWhatsAppParams = {
  schoolId: string;
  tenantId: string;
  paymentId: string;
  triggeredByUserId?: string | null;
  /** Quando true, ignora a janela de 24h (uso interno / jobs — usar com critério). */
  skipCooldown?: boolean;
};

export type PaymentReminderWhatsAppResult = {
  success: true;
  twilioSid: string | null;
  destino: string;
  hasBoletoLink: boolean;
};

/**
 * Envio de lembrete de pagamento por WhatsApp (Twilio), com log em CobrancaEnvio.
 * Replica a regra de negócio de `POST /api/cobrancas/enviar`.
 */
export async function executePaymentReminderWhatsApp(
  params: PaymentReminderWhatsAppParams
): Promise<PaymentReminderWhatsAppResult> {
  const { schoolId, paymentId, triggeredByUserId, skipCooldown } = params;

  if (schoolId !== params.tenantId) {
    throw new Error("tenantId deve coincidir com schoolId neste produto.");
  }

  const pagamento = await prisma.pagamento.findFirst({
    where: { id: paymentId, schoolId },
    include: {
      matricula: {
        include: {
          aluno: true,
        },
      },
    },
  });

  if (!pagamento) {
    throw new Error("PAGAMENTO_NOT_FOUND");
  }

  const ultimoEnvio = await prisma.cobrancaEnvio.findFirst({
    where: {
      pagamentoId: pagamento.id,
      canal: CanalCobranca.WHATSAPP,
      tipo: TipoEnvioCobranca.LEMBRETE,
      status: StatusEnvioCobranca.ENVIADO,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!skipCooldown && !canSendReminder(ultimoEnvio)) {
    throw new Error("COOLDOWN_24H");
  }

  const aluno = pagamento.matricula.aluno;
  const destinoTelefone = aluno.responsavelTelefone || aluno.telefone;

  if (!destinoTelefone) {
    throw new Error("TELEFONE_RESPONSAVEL_AUSENTE");
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
      schoolId: pagamento.matricula.schoolId,
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

    if (triggeredByUserId) {
      const user = await prisma.user.findUnique({
        where: { id: triggeredByUserId },
        select: { role: true },
      });
      if (user) {
        void logSchoolAudit({
          schoolId,
          userId: triggeredByUserId,
          role: user.role,
          domain: "finance",
          action: "PAYMENT_REMINDER_SEND",
          resourceId: pagamento.id,
          summary: `Lembrete de cobrança enviado (WhatsApp): ${aluno.nome}`,
          payload: { canal: "WHATSAPP", source: "automation" },
        });
      }
    }

    await prisma.pagamento.update({
      where: { id: pagamento.id },
      data: { ultimoLembreteEnviadoEm: new Date() },
    });

    return {
      success: true,
      twilioSid: result?.sid ?? null,
      destino: destinoTelefone,
      hasBoletoLink: Boolean(boletoUrl),
    };
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
        error instanceof Error ? error.message : "Erro ao enviar cobrança",
    });
    throw error;
  }
}
