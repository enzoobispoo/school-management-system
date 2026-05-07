import { prisma } from "@/lib/prisma";

export async function queryClasses(
  args: {
    search?: string;
    active?: boolean;
    overCapacityOnly?: boolean;
    limit?: number;
  },
  schoolId?: string | null
) {
  const sid = schoolId?.trim();
  const limit = Math.min(Math.max(Number(args.limit) || 18, 1), 45);
  if (!sid) {
    return { error: "school_missing", turmas: [] as unknown[] };
  }

  const search = args.search?.trim();

  const turmas = await prisma.turma.findMany({
    where: {
      schoolId: sid,
      ...(args.active === false ? {} : { ativo: true }),
      ...(search
        ? { nome: { contains: search, mode: "insensitive" } }
        : {}),
    },
    select: {
      id: true,
      nome: true,
      capacidadeMaxima: true,
      ativo: true,
      curso: { select: { nome: true } },
      matriculas: {
        where: { status: "ATIVA" },
        select: { id: true },
      },
    },
    take: limit,
    orderBy: { nome: "asc" },
  });

  let rows = turmas.map((t) => {
    const ocupacao = t.matriculas.length;
    const cap = t.capacidadeMaxima;
    const lotada = cap > 0 && ocupacao >= cap;
    return {
      id: t.id,
      nome: t.nome,
      curso: t.curso.nome,
      ativa: t.ativo,
      capacidade: cap,
      matriculasAtivas: ocupacao,
      lotada,
      vagasEstimadas: cap > 0 ? Math.max(0, cap - ocupacao) : null,
    };
  });

  if (args.overCapacityOnly) {
    rows = rows.filter((r) => r.lotada);
  }

  return { turmas: rows };
}
