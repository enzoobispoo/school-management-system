import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { buildPaymentReminderMessage } from "@/lib/templates/payment-reminder";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
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
    const user = await getCurrentUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

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