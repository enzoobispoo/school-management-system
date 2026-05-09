import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { buildPaymentReminderMessage } from "@/lib/templates/payment-reminder";
import {
  CanalCobranca,
  StatusEnvioCobranca,
  TipoEnvioCobranca,
} from "@prisma/client";
import { createCobrancaEnvioLog } from "@/lib/services/cobranca-envio-log";
import {
  assertBillingNotify,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";
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

  const diffMs = agora.getTime() - ultimoEnvioAt.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours >= 24;
}

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
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      );
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

    if (!canSendReminder(ultimoEnvio)) {
      return NextResponse.json(
        {
          error: "Já foi enviado um lembrete para este pagamento nas últimas 24 horas.",
          lastSendAt: ultimoEnvio?.createdAt ?? null,
        },
        { status: 409 }
      );
    }

    const aluno = pagamento.matricula.aluno;
    const destinoTelefone = aluno.responsavelTelefone || aluno.telefone;

    if (!destinoTelefone) {
      return NextResponse.json(
        {
          error: `O aluno ${aluno.nome} não possui telefone do responsável nem telefone próprio cadastrado.`,
        },
        { status: 400 }
      );
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

      void logSchoolAudit({
        schoolId,
        userId: user.id,
        role: user.role,
        domain: "finance",
        action: "PAYMENT_REMINDER_SEND",
        resourceId: pagamento.id,
        summary: `Lembrete de cobrança enviado (WhatsApp): ${pagamento.matricula.aluno.nome}`,
        payload: { canal: "WHATSAPP" },
      });

      return NextResponse.json({
        success: true,
        hasBoletoLink: Boolean(boletoUrl),
      });
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