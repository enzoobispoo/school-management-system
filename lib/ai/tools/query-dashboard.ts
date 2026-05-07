import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { pctChangeVsPrevious } from "@/lib/finance/pct-change";

async function fetchDashboardCore(sid: string) {
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalAlunos,
    matriculasAtivas,
    pagamentosRecebidosNoMes,
    pagamentosRecebidosMesAnterior,
    pagamentosPendentes,
    pagamentosAtrasados,
    topCursos,
    incidentesOperacionaisAbertos,
    incidentesOperacionaisCriticos,
  ] = await Promise.all([
    prisma.aluno.count({ where: { schoolId: sid } }),
    prisma.matricula.count({ where: { status: "ATIVA", schoolId: sid } }),
    prisma.pagamento.findMany({
      where: {
        schoolId: sid,
        status: "PAGO",
        dataPagamento: {
          gte: startOfCurrentMonth,
          lt: endOfCurrentMonth,
        },
      },
      select: { valor: true },
    }),
    prisma.pagamento.findMany({
      where: {
        schoolId: sid,
        status: "PAGO",
        dataPagamento: {
          gte: startOfPreviousMonth,
          lt: endOfPreviousMonth,
        },
      },
      select: { valor: true },
    }),
    prisma.pagamento.findMany({
      where: { schoolId: sid, status: "PENDENTE" },
      select: { valor: true },
    }),
    prisma.pagamento.findMany({
      where: { schoolId: sid, status: "ATRASADO" },
      select: { valor: true },
    }),
    prisma.curso.findMany({
      where: { schoolId: sid },
      include: {
        turmas: {
          where: { ativo: true },
          select: {
            id: true,
            nome: true,
            capacidadeMaxima: true,
            matriculas: {
              where: { status: "ATIVA", schoolId: sid },
              select: { id: true },
            },
          },
        },
      },
    }),

    prisma.operationalIncident.count({
      where: {
        schoolId: sid,
        status: { in: ["OPEN", "ACKNOWLEDGED"] },
      },
    }),

    prisma.operationalIncident.count({
      where: {
        schoolId: sid,
        status: { in: ["OPEN", "ACKNOWLEDGED"] },
        severity: "CRITICAL",
      },
    }),
  ]);

  const receitaMes = pagamentosRecebidosNoMes.reduce(
    (acc, item) => acc + Number(item.valor),
    0
  );

  const receitaMesAnterior = pagamentosRecebidosMesAnterior.reduce(
    (acc, item) => acc + Number(item.valor),
    0
  );

  const variacaoReceitaMesVsAnteriorPct = pctChangeVsPrevious(
    receitaMes,
    receitaMesAnterior
  );

  let turmasAtivas = 0;
  let turmasLotadas = 0;
  let turmasComVagas = 0;
  let totalVagasDisponiveisTurmasAtivas = 0;
  const exemplosTurmasLotadas: Array<{
    turmaId: string;
    turmaNome: string;
    cursoNome: string;
    ocupacaoAtiva: number;
    capacidadeMaxima: number;
  }> = [];

  for (const curso of topCursos) {
    for (const turma of curso.turmas) {
      turmasAtivas += 1;
      const occ = turma.matriculas.length;
      const cap = turma.capacidadeMaxima;
      if (cap > 0 && occ >= cap) {
        turmasLotadas += 1;
        if (exemplosTurmasLotadas.length < 8) {
          exemplosTurmasLotadas.push({
            turmaId: turma.id,
            turmaNome: turma.nome,
            cursoNome: curso.nome,
            ocupacaoAtiva: occ,
            capacidadeMaxima: cap,
          });
        }
      } else if (cap > 0 && occ < cap) {
        turmasComVagas += 1;
        totalVagasDisponiveisTurmasAtivas += cap - occ;
      }
    }
  }

  const totalPendentes = pagamentosPendentes.reduce(
    (acc, item) => acc + Number(item.valor),
    0
  );

  const totalAtrasados = pagamentosAtrasados.reduce(
    (acc, item) => acc + Number(item.valor),
    0
  );

  const cursos = topCursos
    .map((curso) => ({
      id: curso.id,
      name: curso.nome,
      category: curso.categoria,
      students: curso.turmas.reduce(
        (acc, turma) => acc + turma.matriculas.length,
        0
      ),
    }))
    .sort((a, b) => b.students - a.students)
    .slice(0, 5);

  return {
    totalAlunos,
    matriculasAtivas,
    receitaMes,
    receitaMesAnterior,
    variacaoReceitaMesVsAnteriorPct,
    totalPendentes,
    totalAtrasados,
    quantidadePendentes: pagamentosPendentes.length,
    quantidadeAtrasados: pagamentosAtrasados.length,
    turmasAtivas,
    turmasLotadas,
    turmasComVagas,
    totalVagasDisponiveisTurmasAtivas,
    exemplosTurmasLotadas,
    incidentesOperacionaisAbertos,
    incidentesOperacionaisCriticos,
    topCursos: cursos,
    snapshotGeradoEm: now.toISOString(),
    /** Contexto para interpretação tipo pulse + recomendações ancoradas em dados */
    notasParaInterpretacao: [
      "Compare receitaMes com receitaMesAnterior usando variacaoReceitaMesVsAnteriorPct (queda pode sugerir revisar captação, mensalidades ou inadimplência — sempre citando os números retornados).",
      "turmasLotadas vs turmasComVagas e totalVagasDisponiveisTurmasAtivas informam onde há capacidade ociosa ou gargalo de vagas.",
      "Combine com query_classes / query_courses / query_payments para detalhar antes de recomendar ações concretas.",
    ],
  };
}

const EMPTY_DASHBOARD = {
  totalAlunos: 0,
  matriculasAtivas: 0,
  receitaMes: 0,
  receitaMesAnterior: 0,
  variacaoReceitaMesVsAnteriorPct: 0,
  totalPendentes: 0,
  totalAtrasados: 0,
  quantidadePendentes: 0,
  quantidadeAtrasados: 0,
  turmasAtivas: 0,
  turmasLotadas: 0,
  turmasComVagas: 0,
  totalVagasDisponiveisTurmasAtivas: 0,
  exemplosTurmasLotadas: [] as Array<{
    turmaId: string;
    turmaNome: string;
    cursoNome: string;
    ocupacaoAtiva: number;
    capacidadeMaxima: number;
  }>,
  incidentesOperacionaisAbertos: 0,
  incidentesOperacionaisCriticos: 0,
  topCursos: [],
  snapshotGeradoEm: null as string | null,
  notasParaInterpretacao: [] as string[],
};

export async function queryDashboard(schoolId?: string | null) {
  const sid = schoolId?.trim();
  if (!sid) {
    return EMPTY_DASHBOARD;
  }

  const cached = unstable_cache(
    () => fetchDashboardCore(sid),
    ["eduia-query-dashboard", sid],
    { revalidate: 60, tags: [`school-dashboard-${sid}`] }
  );

  return cached();
}
