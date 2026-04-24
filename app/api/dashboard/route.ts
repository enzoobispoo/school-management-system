import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
];

function calculatePercentageChange(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function getComputedPaymentStatus(pagamento: {
  status: string;
  vencimento: Date;
  dataPagamento: Date | null;
}) {
  if (pagamento.status === "CANCELADO") return "CANCELADO";
  if (pagamento.status === "PAGO" || pagamento.dataPagamento) return "PAGO";

  const hoje = new Date();
  const vencimento = new Date(pagamento.vencimento);

  hoje.setHours(0, 0, 0, 0);
  vencimento.setHours(0, 0, 0, 0);

  if (vencimento < hoje) return "ATRASADO";
  return "PENDENTE";
}

function getYearFromSearchParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year"));
  const currentYear = new Date().getFullYear();

  if (!Number.isNaN(year) && year >= 2000 && year <= 2100) {
    return year;
  }

  return currentYear;
}

function buildDashboardInsights(params: {
  receitaMensalVariacao: number;
  novosAlunosVariacao: number;
  trocasProfessorVariacao: number;
  turmasComVagasOciosas: number;
  quantidadePagamentosAtrasados: number;
  notificacoesNaoLidas: number;
}) {
  const insights: Array<{
    id: string;
    tone: "positive" | "negative" | "warning" | "neutral";
    title: string;
    description: string;
    action?: {
      label: string;
      href: string;
    };
  }> = [];

  if (params.receitaMensalVariacao > 0) {
    insights.push({
      id: "receita-alta",
      tone: "positive",
      title: "Receita em crescimento",
      description: `A receita mensal subiu ${params.receitaMensalVariacao}% em relação ao mês passado.`,
      action: {
        label: "Ver financeiro",
        href: "/financeiro",
      },
    });
  } else if (params.receitaMensalVariacao < 0) {
    insights.push({
      id: "receita-baixa",
      tone: "negative",
      title: "Receita em queda",
      description: `A receita mensal caiu ${Math.abs(
        params.receitaMensalVariacao
      )}% em relação ao mês passado.`,
      action: {
        label: "Ver financeiro",
        href: "/financeiro",
      },
    });
  }

  if (params.quantidadePagamentosAtrasados > 0) {
    insights.push({
      id: "pagamentos-atrasados",
      tone: "warning",
      title: "Atenção aos atrasos",
      description: `Existem ${params.quantidadePagamentosAtrasados} pagamento(s) atrasado(s) exigindo acompanhamento.`,
      action: {
        label: "Cobrar alunos",
        href: "/financeiro?tab=overdue",
      },
    });
  }

  if (params.turmasComVagasOciosas > 0) {
    insights.push({
      id: "vagas-ociosas",
      tone: "neutral",
      title: "Oportunidade de ocupação",
      description: `${params.turmasComVagasOciosas} turma(s) ainda possuem vagas ociosas.`,
      action: {
        label: "Revisar turmas",
        href: "/turmas?ocupacao=ociosas",
      },
    });
  }

  if (params.novosAlunosVariacao > 0) {
    insights.push({
      id: "novos-alunos",
      tone: "positive",
      title: "Entrada de novos alunos",
      description: `As entradas de alunos cresceram ${params.novosAlunosVariacao}% vs mês passado.`,
      action: {
        label: "Ver alunos novos",
        href: "/alunos?recent=true",
      },
    });
  }

  if (params.trocasProfessorVariacao > 0) {
    insights.push({
      id: "trocas-professor",
      tone: "warning",
      title: "Mais trocas de professor",
      description: `As trocas de professor subiram ${params.trocasProfessorVariacao}% em relação ao mês anterior.`,
      action: {
        label: "Revisar professores",
        href: "/turmas",
      },
    });
  }

  if (params.notificacoesNaoLidas > 0) {
    insights.push({
      id: "notificacoes-nao-lidas",
      tone: "neutral",
      title: "Notificações pendentes",
      description: `Há ${params.notificacoesNaoLidas} notificação(ões) ainda não lida(s).`,
      action: {
        label: "Ver notificações",
        href: "/notificacoes",
      },
    });
  }

  return insights.slice(0, 4);
}

export async function GET(request: NextRequest) {
  try {
    const year = getYearFromSearchParams(request);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    const startOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfCurrentMonth = new Date(currentYear, currentMonth, 1);

    const startOfPreviousMonth = new Date(currentYear, currentMonth - 2, 1);
    const endOfPreviousMonth = new Date(currentYear, currentMonth - 1, 1);

    const [
      totalAlunos,
      matriculasAtivas,
      novosAlunosNoMes,
      novosAlunosMesAnterior,
      pagamentosRecebidosNoMes,
      pagamentosRecebidosMesAnterior,
      pagamentosEmAberto,
      pagamentosDoAno,
      pagamentosPrevistosNoMes,
      cursos,
      notificacoesRecentes,
      notificacoesNaoLidas,
      trocasProfessorNoMes,
      trocasProfessorMesAnterior,
      professoresInativos,
      turmasAtivasComMatriculas,
    ] = await Promise.all([
      prisma.aluno.count(),

      prisma.matricula.count({
        where: { status: "ATIVA" },
      }),

      prisma.aluno.count({
        where: {
          createdAt: {
            gte: startOfCurrentMonth,
            lt: endOfCurrentMonth,
          },
        },
      }),

      prisma.aluno.count({
        where: {
          createdAt: {
            gte: startOfPreviousMonth,
            lt: endOfPreviousMonth,
          },
        },
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
          status: "PAGO",
          dataPagamento: {
            gte: startOfPreviousMonth,
            lt: endOfPreviousMonth,
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

      prisma.pagamento.findMany({
        where: {
          vencimento: {
            gte: startOfCurrentMonth,
            lt: endOfCurrentMonth,
          },
          status: {
            not: "CANCELADO",
          },
        },
        select: {
          valor: true,
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

      prisma.notificacao.count({
        where: { lida: false },
      }),

      prisma.turmaProfessorHistorico.count({
        where: {
          dataInicio: {
            gte: startOfCurrentMonth,
            lt: endOfCurrentMonth,
          },
          OR: [
            { motivoTroca: { not: "Professor inicial" } },
            { motivoTroca: null },
          ],
        },
      }),

      prisma.turmaProfessorHistorico.count({
        where: {
          dataInicio: {
            gte: startOfPreviousMonth,
            lt: endOfPreviousMonth,
          },
          OR: [
            { motivoTroca: { not: "Professor inicial" } },
            { motivoTroca: null },
          ],
        },
      }),

      prisma.professor.count({
        where: { ativo: false },
      }),

      prisma.turma.findMany({
        where: { ativo: true },
        select: {
          id: true,
          capacidadeMaxima: true,
          matriculas: {
            where: { status: "ATIVA" },
            select: { id: true },
          },
        },
      }),
    ]);

    const recebidoNoMes = pagamentosRecebidosNoMes.reduce(
      (acc, item) => acc + Number(item.valor),
      0
    );

    const receitaPrevistaMes = pagamentosPrevistosNoMes.reduce(
      (acc, item) => acc + Number(item.valor),
      0
    );

    const recebidoNoMesAnterior = pagamentosRecebidosMesAnterior.reduce(
      (acc, item) => acc + Number(item.valor),
      0
    );

    const receitaMensalVariacao = calculatePercentageChange(
      recebidoNoMes,
      recebidoNoMesAnterior
    );

    const novosAlunosVariacao = calculatePercentageChange(
      novosAlunosNoMes,
      novosAlunosMesAnterior
    );

    const trocasProfessorVariacao = calculatePercentageChange(
      trocasProfessorNoMes,
      trocasProfessorMesAnterior
    );

    const pagamentosPendentes = pagamentosEmAberto.filter(
      (pagamento) => getComputedPaymentStatus(pagamento) === "PENDENTE"
    );

    const pagamentosAtrasados = pagamentosEmAberto.filter(
      (pagamento) => getComputedPaymentStatus(pagamento) === "ATRASADO"
    );

    const totalPendentes = pagamentosPendentes.reduce(
      (acc, item) => acc + Number(item.valor),
      0
    );

    const totalAtrasados = pagamentosAtrasados.reduce(
      (acc, item) => acc + Number(item.valor),
      0
    );

    const receitaPorMes = Array.from({ length: 12 }, (_, index) => ({
      month: MONTH_LABELS[index],
      receita: 0,
    }));

    for (const pagamento of pagamentosDoAno) {
      if (!pagamento.dataPagamento) continue;
      const monthIndex = new Date(pagamento.dataPagamento).getMonth();
      receitaPorMes[monthIndex].receita += Number(pagamento.valor);
    }

    const alunosPorCurso = cursos.map((curso) => {
      const total = curso.turmas.reduce(
        (acc, turma) => acc + turma.matriculas.length,
        0
      );

      return {
        curso: curso.nome,
        alunos: total,
      };
    });

    const atividadesRecentes = notificacoesRecentes
      .slice(0, 5)
      .map((notificacao) => ({
        id: notificacao.id,
        tipo: notificacao.tipo,
        titulo: notificacao.titulo,
        mensagem: notificacao.mensagem,
        lida: notificacao.lida,
        createdAt: notificacao.createdAt,
      }));

    const turmasAtivas = turmasAtivasComMatriculas.length;

    const turmasLotadas = turmasAtivasComMatriculas.filter(
      (turma) => turma.matriculas.length >= turma.capacidadeMaxima
    ).length;

    const turmasComVagasOciosas = turmasAtivasComMatriculas.filter(
      (turma) => turma.matriculas.length < turma.capacidadeMaxima
    ).length;

    const insights = buildDashboardInsights({
      receitaMensalVariacao,
      novosAlunosVariacao,
      trocasProfessorVariacao,
      turmasComVagasOciosas,
      quantidadePagamentosAtrasados: pagamentosAtrasados.length,
      notificacoesNaoLidas,
    });

    return NextResponse.json({
      metricas: {
        totalAlunos,
        matriculasAtivas,
        novosAlunosNoMes,
        novosAlunosVariacao,
        receitaMensal: recebidoNoMes,
        receitaMensalVariacao,
        receitaPrevistaMes,
        pagamentosPendentes: totalPendentes,
        valoresAtrasados: totalAtrasados,
        quantidadePagamentosPendentes: pagamentosPendentes.length,
        quantidadePagamentosAtrasados: pagamentosAtrasados.length,
        trocasProfessorNoMes,
        trocasProfessorVariacao,
        turmasAtivas,
        turmasLotadas,
        turmasComVagasOciosas,
        professoresInativos,
        notificacoesNaoLidas,
      },
      receitaAoLongoDoTempo: receitaPorMes,
      alunosPorCurso,
      atividadesRecentes,
      notificacoes: notificacoesRecentes,
      insights,
    });
  } catch (error) {
    console.error("Erro ao buscar dashboard:", error);

    return NextResponse.json(
      { error: "Erro ao buscar dashboard" },
      { status: 500 }
    );
  }
}