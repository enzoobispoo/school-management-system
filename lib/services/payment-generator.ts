import { prisma } from "@/lib/prisma";
import { StatusMatricula, StatusPagamento } from "@prisma/client";
import { createBoleto } from "@/lib/billing/provider";
import {
  addCalendarMonths,
  buildDueDateClamped,
  calcularPrimeiroVencimentoMensal,
} from "@/lib/finance/due-date";

function formatDateToYMD(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Usa contrato financeiro da matrícula quando existir (base, % desconto, bolsa); senão valor do curso. */
function resolveMonthlyAmount(
  cursoValorMensal: number,
  contrato: {
    valorMensalidadeBase: { toString(): string } | null;
    descontoPercentual: { toString(): string } | null;
    bolsaValor: { toString(): string } | null;
  } | null
): number {
  let base =
    contrato?.valorMensalidadeBase != null ?
      Number(contrato.valorMensalidadeBase.toString())
    : cursoValorMensal;

  const descPct =
    contrato?.descontoPercentual != null ?
      Number(contrato.descontoPercentual.toString())
    : 0;
  const bolsa =
    contrato?.bolsaValor != null ? Number(contrato.bolsaValor.toString()) : 0;

  const pct = Math.min(100, Math.max(0, Number.isFinite(descPct) ? descPct : 0));
  base *= 1 - pct / 100;
  base -= Number.isFinite(bolsa) ? bolsa : 0;
  const rounded = Math.round(Math.max(0, base) * 100) / 100;
  return rounded > 0 ? rounded : cursoValorMensal;
}

export async function generateNextMonthlyPayments(schoolId: string) {
  const schoolSettings = await prisma.escolaSettings.findUnique({
    where: { schoolId },
    select: {
      diaVencimentoPadrao: true,
      billingEnabled: true,
      billingProvider: true,
      autoGenerateBoleto: true,
      multaAtrasoPercentual: true,
      jurosMensalPercentual: true,
    },
  });

  const schoolDueFallback = schoolSettings?.diaVencimentoPadrao ?? 10;
  const shouldAutoGenerateBoleto =
    Boolean(schoolSettings?.billingEnabled) &&
    schoolSettings?.billingProvider === "asaas" &&
    Boolean(schoolSettings?.autoGenerateBoleto);

  const matriculas = await prisma.matricula.findMany({
    where: {
      schoolId,
      status: StatusMatricula.ATIVA,
    },
    include: {
      aluno: true,
      turma: {
        include: {
          curso: true,
        },
      },
      pagamentos: {
        orderBy: [
          { competenciaAno: "desc" },
          { competenciaMes: "desc" },
        ],
      },
      contratoFinanceiro: true,
    },
  });

  let generatedCount = 0;
  let boletoGeneratedCount = 0;
  let boletoErrorCount = 0;

  for (const matricula of matriculas) {
    const ultimoPagamento = matricula.pagamentos[0];

    const dueDay =
      matricula.diaVencimentoMensal ?? schoolDueFallback;

    let proximoMes: number;
    let proximoAno: number;

    if (ultimoPagamento) {
      const nextComp = addCalendarMonths(
        ultimoPagamento.competenciaAno,
        ultimoPagamento.competenciaMes,
        1
      );
      proximoMes = nextComp.month1based;
      proximoAno = nextComp.year;
    } else {
      const primeiro = calcularPrimeiroVencimentoMensal(
        matricula.dataMatricula,
        dueDay
      );
      proximoMes = primeiro.getMonth() + 1;
      proximoAno = primeiro.getFullYear();
    }

    const pagamentoExistente = await prisma.pagamento.findFirst({
      where: {
        matriculaId: matricula.id,
        competenciaMes: proximoMes,
        competenciaAno: proximoAno,
      },
      select: { id: true },
    });

    if (pagamentoExistente) {
      continue;
    }

    const vencimento = buildDueDateClamped(proximoAno, proximoMes - 1, dueDay);

    const valorParcela = resolveMonthlyAmount(
      Number(matricula.turma.curso.valorMensal),
      matricula.contratoFinanceiro
    );

    const pagamento = await prisma.pagamento.create({
      data: {
        schoolId,
        matriculaId: matricula.id,
        competenciaMes: proximoMes,
        competenciaAno: proximoAno,
        descricao: `Mensalidade ${String(proximoMes).padStart(2, "0")}/${proximoAno} - ${matricula.turma.curso.nome}`,
        valor: valorParcela,
        vencimento,
        status: StatusPagamento.PENDENTE,
      },
    });

    generatedCount++;

    if (!shouldAutoGenerateBoleto) {
      continue;
    }

    try {
      const aluno = matricula.aluno;

      const boleto = await createBoleto({
        studentName: aluno.responsavelNome || aluno.nome,
        studentEmail: aluno.responsavelEmail || aluno.email,
        studentCpf: aluno.cpf,
        phone: aluno.responsavelTelefone || aluno.telefone,
        amount: Number(pagamento.valor),
        dueDate: formatDateToYMD(pagamento.vencimento),
        description: pagamento.descricao,
        externalReference: pagamento.id,
        interestPercentage: schoolSettings?.jurosMensalPercentual
          ? Number(schoolSettings.jurosMensalPercentual)
          : 0,
        finePercentage: schoolSettings?.multaAtrasoPercentual
          ? Number(schoolSettings.multaAtrasoPercentual)
          : 0,
      });

      await prisma.pagamento.update({
        where: { id: pagamento.id },
        data: {
          billingProvider: "asaas",
          billingExternalId: boleto.paymentId,
          billingInvoiceUrl: boleto.invoiceUrl,
          billingBankSlipUrl: boleto.bankSlipUrl,
          billingStatus: boleto.status,
          boletoGeradoEm: new Date(),
        },
      });

      boletoGeneratedCount++;
    } catch (error) {
      boletoErrorCount++;

      console.error(
        `Erro ao gerar boleto automático para o pagamento ${pagamento.id}:`,
        error
      );
    }
  }

  return {
    totalMatriculas: matriculas.length,
    generatedCount,
    boletoGeneratedCount,
    boletoErrorCount,
  };
}
