import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
]

function getComputedPaymentStatus(pagamento: {
  status: string
  vencimento: Date
  dataPagamento: Date | null
}) {
  if (pagamento.status === "CANCELADO") return "CANCELADO"
  if (pagamento.status === "PAGO" || pagamento.dataPagamento) return "PAGO"

  const hoje = new Date()
  const vencimento = new Date(pagamento.vencimento)

  hoje.setHours(0, 0, 0, 0)
  vencimento.setHours(0, 0, 0, 0)

  if (vencimento < hoje) return "ATRASADO"
  return "PENDENTE"
}

function getYearFromSearchParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const year = Number(searchParams.get("year"))
  const currentYear = new Date().getFullYear()

  if (!Number.isNaN(year) && year >= 2000 && year <= 2100) {
    return year
  }

  return currentYear
}

export async function GET(request: NextRequest) {
  try {
    const year = getYearFromSearchParams(request)
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const startOfYear = new Date(year, 0, 1)
    const endOfYear = new Date(year + 1, 0, 1)

    const startOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1)
    const endOfCurrentMonth = new Date(currentYear, currentMonth, 1)

    const [
      totalAlunos,
      matriculasAtivas,
      pagamentosRecebidosNoMes,
      pagamentosEmAberto,
      pagamentosDoAno,
      cursos,
      notificacoesRecentes,
    ] = await Promise.all([
      prisma.aluno.count(),
      prisma.matricula.count({
        where: { status: "ATIVA" },
      }),
      prisma.pagamento.findMany({
        where: {
          status: "PAGO",
          dataPagamento: {
            gte: startOfCurrentMonth,
            lt: endOfCurrentMonth,
          },
        },
        select: {
          valor: true,
        },
      }),
      prisma.pagamento.findMany({
        where: {
          status: {
            in: ["PENDENTE", "ATRASADO"],
          },
        },
        select: {
          valor: true,
          status: true,
          vencimento: true,
          dataPagamento: true,
        },
      }),
      prisma.pagamento.findMany({
        where: {
          status: "PAGO",
          dataPagamento: {
            gte: startOfYear,
            lt: endOfYear,
          },
        },
        select: {
          valor: true,
          dataPagamento: true,
        },
      }),
      prisma.curso.findMany({
        where: { ativo: true },
        include: {
          turmas: {
            include: {
              matriculas: {
                where: { status: "ATIVA" },
                select: { id: true },
              },
            },
          },
        },
        orderBy: { nome: "asc" },
      }),
      prisma.notificacao.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ])

    const recebidoNoMes = pagamentosRecebidosNoMes.reduce(
      (acc, item) => acc + Number(item.valor),
      0
    )

    const pagamentosPendentes = pagamentosEmAberto.filter(
      (pagamento) => getComputedPaymentStatus(pagamento) === "PENDENTE"
    )

    const pagamentosAtrasados = pagamentosEmAberto.filter(
      (pagamento) => getComputedPaymentStatus(pagamento) === "ATRASADO"
    )

    const totalPendentes = pagamentosPendentes.reduce(
      (acc, item) => acc + Number(item.valor),
      0
    )

    const totalAtrasados = pagamentosAtrasados.reduce(
      (acc, item) => acc + Number(item.valor),
      0
    )

    const receitaPorMes = Array.from({ length: 12 }, (_, index) => ({
      month: MONTH_LABELS[index],
      receita: 0,
    }))

    for (const pagamento of pagamentosDoAno) {
      if (!pagamento.dataPagamento) continue
      const monthIndex = new Date(pagamento.dataPagamento).getMonth()
      receitaPorMes[monthIndex].receita += Number(pagamento.valor)
    }

    const alunosPorCurso = cursos.map((curso) => {
      const total = curso.turmas.reduce(
        (acc, turma) => acc + turma.matriculas.length,
        0
      )

      return {
        curso: curso.nome,
        alunos: total,
      }
    })

    const atividadesRecentes = notificacoesRecentes.slice(0, 5).map((notificacao) => ({
      id: notificacao.id,
      tipo: notificacao.tipo,
      titulo: notificacao.titulo,
      mensagem: notificacao.mensagem,
      lida: notificacao.lida,
      createdAt: notificacao.createdAt,
    }))

    return NextResponse.json({
      metricas: {
        totalAlunos,
        matriculasAtivas,
        receitaMensal: recebidoNoMes,
        pagamentosPendentes: totalPendentes,
        valoresAtrasados: totalAtrasados,
        quantidadePagamentosPendentes: pagamentosPendentes.length,
        quantidadePagamentosAtrasados: pagamentosAtrasados.length,
      },
      receitaAoLongoDoTempo: receitaPorMes,
      alunosPorCurso,
      atividadesRecentes,
      notificacoes: notificacoesRecentes,
    })
  } catch (error) {
    console.error("Erro ao buscar dashboard:", error)

    return NextResponse.json(
      { error: "Erro ao buscar dashboard" },
      { status: 500 }
    )
  }
}