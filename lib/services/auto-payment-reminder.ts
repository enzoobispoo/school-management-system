import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { buildPaymentReminderMessage } from "@/lib/templates/payment-reminder";
import {
  CanalCobranca,
  StatusEnvioCobranca,
  TipoEnvioCobranca,
} from "@prisma/client";
import { createCobrancaEnvioLog } from "@/lib/services/cobranca-envio-log";
import { canSendCobranca } from "@/lib/services/cobranca-cooldown";

function formatCompetence(month: number, year: number) {
  return `${String(month).padStart(2, "0")}/${year}`;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function sendAutomaticOverdueReminders() {
  const school = await prisma.escolaSettings.findUnique({
    where: { id: "default" },
    select: {
      enviarLembreteAuto: true,
    },
  });

  if (!school?.enviarLembreteAuto) {
    return {
      success: true,
      enabled: false,
      sentCount: 0,
      skipped: [],
      message: "Envio automático de lembretes está desativado.",
    };
  }

  const todayStart = startOfToday();

  const pagamentos = await prisma.pagamento.findMany({
    where: {
      status: {
        in: ["PENDENTE", "ATRASADO"],
      },
      dataPagamento: null,
      vencimento: {
        lt: todayStart,
      },
      OR: [
        { ultimoLembreteEnviadoEm: null },
        { ultimoLembreteEnviadoEm: { lt: todayStart } },
      ],
    },
    include: {
      matricula: {
        include: {
          aluno: true,
        },
      },
    },
    orderBy: {
      vencimento: "asc",
    },
  });

  let sentCount = 0;
  const skipped: string[] = [];

  for (const pagamento of pagamentos) {
    const aluno = pagamento.matricula.aluno;
    const destinoTelefone = aluno.responsavelTelefone || aluno.telefone;
    const boletoUrl =
      pagamento.billingBankSlipUrl || pagamento.billingInvoiceUrl;

    if (!destinoTelefone) {
      skipped.push(`${aluno.nome} (sem telefone cadastrado)`);
      continue;
    }

    const ultimoEnvio = await prisma.cobrancaEnvio.findFirst({
      where: {
        pagamentoId: pagamento.id,
        canal: CanalCobranca.WHATSAPP,
        tipo: TipoEnvioCobranca.COBRANCA_ATRASO,
        status: StatusEnvioCobranca.ENVIADO,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const cooldown = canSendCobranca(
      TipoEnvioCobranca.COBRANCA_ATRASO,
      ultimoEnvio
    );

    if (!cooldown.allowed) {
      skipped.push(
        `${aluno.nome} (cobrança automática já enviada recentemente - aguarde ${cooldown.remainingHours}h)`
      );
      continue;
    }

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
      });

      await prisma.pagamento.update({
        where: { id: pagamento.id },
        data: {
          ultimoLembreteEnviadoEm: new Date(),
        },
      });

      await createCobrancaEnvioLog({
        pagamentoId: pagamento.id,
        canal: CanalCobranca.WHATSAPP,
        tipo: TipoEnvioCobranca.COBRANCA_ATRASO,
        destino: destinoTelefone,
        status: StatusEnvioCobranca.ENVIADO,
        provedor: "twilio",
        externalId: result?.sid ?? null,
        mensagem: message,
      });

      sentCount += 1;
    } catch (error) {
      await createCobrancaEnvioLog({
        pagamentoId: pagamento.id,
        canal: CanalCobranca.WHATSAPP,
        tipo: TipoEnvioCobranca.COBRANCA_ATRASO,
        destino: destinoTelefone,
        status: StatusEnvioCobranca.FALHO,
        provedor: "twilio",
        mensagem: message,
        erro:
          error instanceof Error
            ? error.message
            : "Erro ao enviar lembrete automático",
      });

      skipped.push(`${aluno.nome} (falha no envio)`);
    }
  }

  return {
    success: true,
    enabled: true,
    sentCount,
    skipped,
    message: `Lembretes automáticos enviados para ${sentCount} pagamento(s).`,
  };
}