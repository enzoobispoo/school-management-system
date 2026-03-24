import { prisma } from "@/lib/prisma"
import { StatusMatricula, StatusPagamento } from "@prisma/client"

function addMonths(date: Date, months: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function buildDueDate(year: number, monthIndexZeroBased: number, dueDay = 10) {
  return new Date(year, monthIndexZeroBased, dueDay)
}

export async function generateNextMonthlyPayments() {
  const matriculas = await prisma.matricula.findMany({
    where: {
      status: StatusMatricula.ATIVA,
    },
    include: {
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

  for (const matricula of matriculas) {
    const ultimoPagamento = matricula.pagamentos[0]

    let proximoMes: number
    let proximoAno: number

    if (ultimoPagamento) {
      const baseDate = buildDueDate(
        ultimoPagamento.competenciaAno,
        ultimoPagamento.competenciaMes - 1
      )
      const nextDate = addMonths(baseDate, 1)
      proximoMes = nextDate.getMonth() + 1
      proximoAno = nextDate.getFullYear()
    } else {
      const dataBase = matricula.dataMatricula
      const dueDay = 10

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

    const vencimento = buildDueDate(proximoAno, proximoMes - 1)

    await prisma.pagamento.create({
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
  }

  return {
    totalMatriculas: matriculas.length,
    generatedCount,
  }
}