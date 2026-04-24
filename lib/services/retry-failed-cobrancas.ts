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

const RETRY_DELAY_MS = 60 * 60 * 1000; // 1 hora
const MAX_RETRY_ATTEMPTS = 3;
const MAX_ITEMS_PER_RUN = 50;

export async function retryFailedCobrancas() {
  const limiteRetry = new Date(Date.now() - RETRY_DELAY_MS);

  const falhas = await prisma.cobrancaEnvio.findMany({
    where: {
      status: StatusEnvioCobranca.FALHO,
      canal: CanalCobranca.WHATSAPP,
      pagamentoId: {
        not: null,
      },
      createdAt: {
        lte: limiteRetry,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: MAX_ITEMS_PER_RUN,
    include: {
      pagamento: {
        include: {
          matricula: {
            include: {
              aluno: true,
            },
          },
        },
      },
    },
  });

  let retriedCount = 0;
  let successCount = 0;
  let failedAgainCount = 0;
  const skipped: string[] = [];

  for (const falha of falhas) {
    const pagamento = falha.pagamento;

    if (!pagamento) {
      skipped.push(`Log ${falha.id} sem pagamento relacionado`);
      continue;
    }

    const aluno = pagamento.matricula.aluno;
    const destinoTelefone = aluno.responsavelTelefone || aluno.telefone;

    if (!destinoTelefone) {
      skipped.push(`${aluno.nome} (sem telefone cadastrado)`);
      continue;
    }

    const tentativasDoMesmoTipo = await prisma.cobrancaEnvio.count({
      where: {
        pagamentoId: pagamento.id,
        canal: CanalCobranca.WHATSAPP,
        tipo: falha.tipo,
      },
    });

    if (tentativasDoMesmoTipo >= MAX_RETRY_ATTEMPTS) {
      skipped.push(
        `${aluno.nome} (limite de ${MAX_RETRY_ATTEMPTS} tentativas atingido para ${falha.tipo})`
      );
      continue;
    }

    const ultimoEnvioBemSucedido = await prisma.cobrancaEnvio.findFirst({
      where: {
        pagamentoId: pagamento.id,
        canal: CanalCobranca.WHATSAPP,
        tipo: falha.tipo,
        status: StatusEnvioCobranca.ENVIADO,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const cooldown = canSendCobranca(falha.tipo, ultimoEnvioBemSucedido);

    if (!cooldown.allowed) {
      skipped.push(
        `${aluno.nome} (${falha.tipo} já enviado recentemente - aguarde ${cooldown.remainingHours}h)`
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
      });

      await createCobrancaEnvioLog({
        pagamentoId: pagamento.id,
        canal: CanalCobranca.WHATSAPP,
        tipo: falha.tipo,
        destino: destinoTelefone,
        status: StatusEnvioCobranca.ENVIADO,
        provedor: "twilio",
        externalId: result?.sid ?? null,
        mensagem: message,
      });

      if (falha.tipo === TipoEnvioCobranca.COBRANCA_ATRASO) {
        await prisma.pagamento.update({
          where: { id: pagamento.id },
          data: {
            ultimoLembreteEnviadoEm: new Date(),
          },
        });
      }

      retriedCount += 1;
      successCount += 1;
    } catch (error) {
      await createCobrancaEnvioLog({
        pagamentoId: pagamento.id,
        canal: CanalCobranca.WHATSAPP,
        tipo: falha.tipo,
        destino: destinoTelefone,
        status: StatusEnvioCobranca.FALHO,
        provedor: "twilio",
        mensagem: message,
        erro:
          error instanceof Error
            ? error.message
            : "Erro ao reenviar cobrança",
      });

      retriedCount += 1;
      failedAgainCount += 1;
      skipped.push(`${aluno.nome} (falhou novamente no retry)`);
    }
  }

  return {
    success: true,
    retriedCount,
    successCount,
    failedAgainCount,
    skipped,
    message: `Retry executado em ${retriedCount} cobrança(s). ${successCount} enviada(s) com sucesso e ${failedAgainCount} falhou(aram) novamente.`,
  };
}