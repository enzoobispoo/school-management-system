import { prisma } from "@/lib/prisma"
import { StatusMatricula, StatusPagamento } from "@prisma/client"
import { createBoleto } from "@/lib/billing/provider";

function addMonths(date: Date, months: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function buildDueDate(year: number, monthIndexZeroBased: number, dueDay = 10) {
  return new Date(year, monthIndexZeroBased, dueDay)
}

function formatDateToYMD(date: Date) {
  return date.toISOString().slice(0, 10)
}

export async function generateNextMonthlyPayments() {
  const schoolSettings = await prisma.escolaSettings.findUnique({
    where: { id: "default" },
    select: {
      diaVencimentoPadrao: true,
      billingEnabled: true,
      billingProvider: true,
      autoGenerateBoleto: true,
      multaAtrasoPercentual: true,
      jurosMensalPercentual: true,
    },
  })

  const dueDay = schoolSettings?.diaVencimentoPadrao ?? 10
  const shouldAutoGenerateBoleto =
    Boolean(schoolSettings?.billingEnabled) &&
    schoolSettings?.billingProvider === "asaas" &&
    Boolean(schoolSettings?.autoGenerateBoleto)

  const matriculas = await prisma.matricula.findMany({
    where: {
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
    },
  })

  let generatedCount = 0
  let boletoGeneratedCount = 0
  let boletoErrorCount = 0

  for (const matricula of matriculas) {
    const ultimoPagamento = matricula.pagamentos[0]

    let proximoMes: number
    let proximoAno: number

    if (ultimoPagamento) {
      const baseDate = buildDueDate(
        ultimoPagamento.competenciaAno,
        ultimoPagamento.competenciaMes - 1,
        dueDay
      )
      const nextDate = addMonths(baseDate, 1)
      proximoMes = nextDate.getMonth() + 1
      proximoAno = nextDate.getFullYear()
    } else {
      const dataBase = matricula.dataMatricula

      const primeiroVencimento = new Date(
        dataBase.getFullYear(),
        dataBase.getMonth(),
        dueDay
      )

      if (dataBase.getDate() > dueDay) {
        primeiroVencimento.setMonth(primeiroVencimento.getMonth() + 1)
      }

      proximoMes = primeiroVencimento.getMonth() + 1
      proximoAno = primeiroVencimento.getFullYear()
    }

    const pagamentoExistente = await prisma.pagamento.findFirst({
      where: {
        matriculaId: matricula.id,
        competenciaMes: proximoMes,
        competenciaAno: proximoAno,
      },
      select: { id: true },
    })

    if (pagamentoExistente) {
      continue
    }

    const vencimento = buildDueDate(proximoAno, proximoMes - 1, dueDay)

    const pagamento = await prisma.pagamento.create({
      data: {
        matriculaId: matricula.id,
        competenciaMes: proximoMes,
        competenciaAno: proximoAno,
        descricao: `Mensalidade ${String(proximoMes).padStart(2, "0")}/${proximoAno} - ${matricula.turma.curso.nome}`,
        valor: matricula.turma.curso.valorMensal,
        vencimento,
        status: StatusPagamento.PENDENTE,
      },
    })

    generatedCount++

    if (!shouldAutoGenerateBoleto) {
      continue
    }

    try {
      const aluno = matricula.aluno
    
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
      })
    
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
      })
    
      boletoGeneratedCount++
    } catch (error) {
      boletoErrorCount++
    
      console.error(
        `Erro ao gerar boleto automático para o pagamento ${pagamento.id}:`,
        error
      )
    }
  }

  return {
    totalMatriculas: matriculas.length,
    generatedCount,
    boletoGeneratedCount,
    boletoErrorCount,
  }
}