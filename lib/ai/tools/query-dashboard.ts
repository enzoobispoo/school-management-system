import { prisma } from "@/lib/prisma";

export async function queryDashboard(schoolId?: string | null) {
  const sid = schoolId?.trim();
  if (!sid) {
    return {
      totalAlunos: 0,
      matriculasAtivas: 0,
      receitaMes: 0,
      totalPendentes: 0,
      totalAtrasados: 0,
      quantidadePendentes: 0,
      quantidadeAtrasados: 0,
      topCursos: [],
    };
  }

  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    totalAlunos,
    matriculasAtivas,
    pagamentosRecebidosNoMes,
    pagamentosPendentes,
    pagamentosAtrasados,
    topCursos,
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
          include: {
            matriculas: {
              where: { status: "ATIVA" },
              select: { id: true },
            },
          },
        },
      },
    }),
  ]);

  const receitaMes = pagamentosRecebidosNoMes.reduce(
    (acc, item) => acc + Number(item.valor),
    0
  );

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
    totalPendentes,
    totalAtrasados,
    quantidadePendentes: pagamentosPendentes.length,
    quantidadeAtrasados: pagamentosAtrasados.length,
    topCursos: cursos,
  };
}