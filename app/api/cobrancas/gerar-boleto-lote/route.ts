import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBoleto } from "@/lib/billing/provider";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
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

    const { paymentIds } = await request.json();

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma mensalidade selecionada." },
        { status: 400 }
      );
    }

    const pagamentos = await prisma.pagamento.findMany({
      where: {
        id: { in: paymentIds },
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

    if (pagamentos.length === 0) {
      return NextResponse.json(
        { error: "Pagamentos não encontrados." },
        { status: 404 }
      );
    }

    const alunoIdBase = pagamentos[0].matricula.aluno.id;
    const mesmoAluno = pagamentos.every(
      (pagamento) => pagamento.matricula.aluno.id === alunoIdBase
    );

    if (!mesmoAluno) {
      return NextResponse.json(
        { error: "Selecione apenas mensalidades do mesmo aluno." },
        { status: 400 }
      );
    }

    const algumPago = pagamentos.some(
      (pagamento) => pagamento.status === "PAGO" || pagamento.dataPagamento
    );

    if (algumPago) {
      return NextResponse.json(
        { error: "A seleção contém mensalidade já paga." },
        { status: 400 }
      );
    }

    const pagamentosComBoleto = pagamentos.filter(hasExistingBoleto);

    if (pagamentosComBoleto.length === pagamentos.length) {
      const externalIdBase = pagamentosComBoleto[0].billingExternalId;
      const mesmoBoleto = pagamentosComBoleto.every(
        (pagamento) => pagamento.billingExternalId === externalIdBase
      );

      if (!mesmoBoleto) {
        return NextResponse.json(
          {
            error:
              "As mensalidades selecionadas já possuem boletos diferentes. Ajuste a seleção.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        reused: true,
        message: "As mensalidades selecionadas já possuem um boleto gerado.",
        boleto: {
          provider: pagamentosComBoleto[0].billingProvider,
          paymentId: pagamentosComBoleto[0].billingExternalId,
          invoiceUrl: pagamentosComBoleto[0].billingInvoiceUrl,
          bankSlipUrl: pagamentosComBoleto[0].billingBankSlipUrl,
          status: pagamentosComBoleto[0].billingStatus,
        },
      });
    }

    if (pagamentosComBoleto.length > 0 && pagamentosComBoleto.length < pagamentos.length) {
      return NextResponse.json(
        {
          error:
            "A seleção contém mensalidades com e sem boleto. Ajuste a seleção antes de continuar.",
        },
        { status: 400 }
      );
    }

    const aluno = pagamentos[0].matricula.aluno;
    const total = pagamentos.reduce((sum, pagamento) => {
      return sum + Number(pagamento.valor);
    }, 0);

    const dueDate = formatDateToYMD(pagamentos[0].vencimento);

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
        amount: total,
        dueDate,
        description: `Mensalidades em aberto (${pagamentos.length}) - ${aluno.nome}`,
        externalReference: paymentIds.join(","),
        interestPercentage: school?.jurosMensalPercentual
          ? Number(school.jurosMensalPercentual)
          : 0,
        finePercentage: school?.multaAtrasoPercentual
          ? Number(school.multaAtrasoPercentual)
          : 0,
      })

      if (!aluno.asaasCustomerId && boleto.customerId) {
        await prisma.aluno.update({
          where: { id: aluno.id },
          data: {
            asaasCustomerId: boleto.customerId,
          },
        });
      }

    await prisma.pagamento.updateMany({
      where: {
        id: { in: paymentIds },
      },
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
        const message = `Olá ${aluno.responsavelNome || aluno.nome}! 👋

Identificamos ${pagamentos.length} mensalidade(s) em aberto:

💰 Valor total: R$ ${total.toFixed(2).replace(".", ",")}
📅 Vencimento: ${new Date(pagamentos[0].vencimento).toLocaleDateString("pt-BR")}

🧾 Link do boleto:
${boletoUrl}

Se o pagamento já foi realizado, desconsidere esta mensagem. Caso precise de apoio, estamos à disposição.`;

        try {
          const result = await sendWhatsAppMessage({
            to: destinoTelefone,
            message,
          });

          for (const pagamento of pagamentos) {
            await createCobrancaEnvioLog({
              pagamentoId: pagamento.id,
              canal: CanalCobranca.WHATSAPP,
              tipo: TipoEnvioCobranca.BOLETO,
              destino: destinoTelefone,
              status: StatusEnvioCobranca.ENVIADO,
              provedor: "twilio",
              externalId: result?.sid ?? null,
              mensagem: message,
            });
          }
        } catch (error) {
          for (const pagamento of pagamentos) {
            await createCobrancaEnvioLog({
              pagamentoId: pagamento.id,
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
    }

    return NextResponse.json({
      success: true,
      reused: false,
      boleto,
    });
  } catch (error) {
    console.error("Erro ao gerar boleto em lote:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao gerar boleto consolidado.",
      },
      { status: 500 }
    );
  }
}