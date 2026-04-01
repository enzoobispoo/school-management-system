import { prisma } from "@/lib/prisma";

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export async function buildAiContext() {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(
    hoje.getFullYear(),
    hoje.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  const [
    totalAlunos,
    matriculasAtivas,
    pagamentosPendentes,
    pagamentosAtrasados,
    receitaRecebidaNoMes,
    cursosTop,
    proximosEventos,
  ] = await Promise.all([
    prisma.aluno.count(),
    prisma.matricula.count({ where: { status: "ATIVA" } }),
    prisma.pagamento.findMany({
      where: { status: "PENDENTE" },
      include: {
        matricula: {
          include: {
            aluno: true,
            turma: { include: { curso: true } },
          },
        },
      },
      orderBy: { vencimento: "asc" },
      take: 8,
    }),
    prisma.pagamento.findMany({
      where: { status: "ATRASADO" },
      include: {
        matricula: {
          include: {
            aluno: true,
            turma: { include: { curso: true } },
          },
        },
      },
      orderBy: { vencimento: "asc" },
      take: 8,
    }),
    prisma.pagamento.aggregate({
      _sum: { valor: true },
      where: {
        status: "PAGO",
        dataPagamento: {
          gte: inicioMes,
          lte: fimMes,
        },
      },
    }),
    prisma.curso.findMany({
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
    }),
    prisma.evento.findMany({
      where: {
        dataInicio: { gte: hoje },
        ativo: true,
      },
      include: {
        professor: true,
        turma: true,
        curso: true,
      },
      orderBy: { dataInicio: "asc" },
      take: 6,
    }),
  ]);

  const cursosRankeados = cursosTop
    .map((curso) => ({
      nome: curso.nome,
      alunos: curso.turmas.reduce(
        (acc, turma) => acc + turma.matriculas.length,
        0
      ),
    }))
    .sort((a, b) => b.alunos - a.alunos)
    .slice(0, 5);

  return {
    resumo: {
      totalAlunos,
      matriculasAtivas,
      receitaMensalRecebida: formatCurrency(
        Number(receitaRecebidaNoMes._sum.valor ?? 0)
      ),
      quantidadePagamentosPendentes: pagamentosPendentes.length,
      quantidadePagamentosAtrasados: pagamentosAtrasados.length,
    },
    pagamentosPendentes: pagamentosPendentes.map((p) => ({
      aluno: p.matricula.aluno.nome,
      curso: p.matricula.turma.curso.nome,
      valor: formatCurrency(Number(p.valor)),
      vencimento: p.vencimento.toISOString(),
    })),
    pagamentosAtrasados: pagamentosAtrasados.map((p) => ({
      aluno: p.matricula.aluno.nome,
      curso: p.matricula.turma.curso.nome,
      valor: formatCurrency(Number(p.valor)),
      vencimento: p.vencimento.toISOString(),
    })),
    cursosMaisPopulares: cursosRankeados,
    proximosEventos: proximosEventos.map((e) => ({
      titulo: e.titulo,
      tipo: e.tipo,
      inicio: e.dataInicio.toISOString(),
      professor: e.professor?.nome ?? null,
      turma: e.turma?.nome ?? null,
      curso: e.curso?.nome ?? null,
    })),
  };
}