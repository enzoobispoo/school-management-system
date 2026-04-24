import { prisma } from "@/lib/prisma";

export async function queryDashboard() {
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
    prisma.aluno.count(),
    prisma.matricula.count({ where: { status: "ATIVA" } }),
    prisma.pagamento.findMany({
      where: {
        status: "PAGO",
        dataPagamento: {
          gte: startOfCurrentMonth,
          lt: endOfCurrentMonth,
        },
      },
      select: { valor: true },
    }),
    prisma.pagamento.findMany({
      where: { status: "PENDENTE" },
      select: { valor: true },
    }),
    prisma.pagamento.findMany({
      where: { status: "ATRASADO" },
      select: { valor: true },
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