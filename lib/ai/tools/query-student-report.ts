import { prisma } from "@/lib/prisma";

type MatriculaBoletimRow = {
  id: string;
  status: string;
  aluno: { id: string; nome: string };
  turma: { id: string; nome: string };
  notas: Array<{
    nota: unknown;
    avaliacao: {
      titulo: string;
      disciplina: { id: string; nome: string };
    };
  }>;
  presencas: Array<{
    presente: boolean;
    aula: {
      disciplina: { id: string; nome: string };
    };
  }>;
};

function aggregateBoletim(matricula: MatriculaBoletimRow) {
  const byDisciplina = new Map<
    string,
    {
      disciplinaId: string;
      disciplinaNome: string;
      notas: number[];
      presencas: number;
      faltas: number;
      avaliacoes: Array<{ titulo: string; nota: number }>;
    }
  >();

  for (const notaRow of matricula.notas) {
    const key = notaRow.avaliacao.disciplina.id;
    const cur = byDisciplina.get(key) || {
      disciplinaId: key,
      disciplinaNome: notaRow.avaliacao.disciplina.nome,
      notas: [],
      presencas: 0,
      faltas: 0,
      avaliacoes: [],
    };
    const n = Number(notaRow.nota);
    cur.notas.push(n);
    cur.avaliacoes.push({
      titulo: notaRow.avaliacao.titulo,
      nota: n,
    });
    byDisciplina.set(key, cur);
  }

  for (const presenca of matricula.presencas) {
    const key = presenca.aula.disciplina.id;
    const cur = byDisciplina.get(key) || {
      disciplinaId: key,
      disciplinaNome: presenca.aula.disciplina.nome,
      notas: [],
      presencas: 0,
      faltas: 0,
      avaliacoes: [],
    };
    if (presenca.presente) cur.presencas += 1;
    else cur.faltas += 1;
    byDisciplina.set(key, cur);
  }

  return Array.from(byDisciplina.values()).map((item) => {
    const media =
      item.notas.length > 0
        ? item.notas.reduce((acc, n) => acc + n, 0) / item.notas.length
        : null;
    const totalChamadas = item.presencas + item.faltas;
    const frequenciaPercent =
      totalChamadas > 0 ? (item.presencas / totalChamadas) * 100 : null;
    return {
      disciplinaId: item.disciplinaId,
      disciplinaNome: item.disciplinaNome,
      avaliacoes: item.avaliacoes,
      media,
      chamadasRegistradas: totalChamadas,
      frequenciaPercent:
        frequenciaPercent !== null
          ? Number(frequenciaPercent.toFixed(1))
          : null,
    };
  });
}

const boletimInclude = {
  aluno: { select: { id: true, nome: true } },
  turma: { select: { id: true, nome: true } },
  notas: {
    include: {
      avaliacao: {
        select: {
          titulo: true,
          disciplina: { select: { id: true, nome: true } },
        },
      },
    },
  },
  presencas: {
    include: {
      aula: {
        include: {
          disciplina: { select: { id: true, nome: true } },
        },
      },
    },
  },
} as const;

/**
 * Boletim somente leitura por nome do aluno, matrícula ou turma (filtro opcional).
 */
export async function queryStudentReport(
  args: {
    studentName?: string;
    matriculaId?: string;
    turmaSearch?: string;
    /** Preferir matrícula ATIVA ao buscar por nome */
    activeOnly?: boolean;
    limit?: number;
  },
  schoolId?: string | null
) {
  const sid = schoolId?.trim();
  const lim = Math.min(Math.max(Number(args.limit) || 6, 1), 12);

  if (!sid) {
    return { error: "school_missing" };
  }

  const turmaFilter =
    args.turmaSearch?.trim().length ?
      {
        turma: {
          nome: { contains: args.turmaSearch.trim(), mode: "insensitive" as const },
        },
      }
    : {};

  const activeOnly = args.activeOnly !== false;

  if (args.matriculaId?.trim()) {
    const row = await prisma.matricula.findFirst({
      where: { id: args.matriculaId.trim(), schoolId: sid },
      include: boletimInclude,
    });

    if (!row) {
      return { error: "matricula_not_found", matriculaId: args.matriculaId.trim() };
    }

    return {
      matriculaId: row.id,
      status: row.status,
      aluno: row.aluno,
      turma: row.turma,
      disciplinas: aggregateBoletim(row as MatriculaBoletimRow),
    };
  }

  const name = args.studentName?.trim();
  if (!name) {
    return {
      error: "missing_student_hint",
      message:
        "Informe studentName (nome do aluno) ou matriculaId retornado por outra consulta.",
    };
  }

  const rows = await prisma.matricula.findMany({
    where: {
      schoolId: sid,
      ...(activeOnly ? { status: "ATIVA" } : {}),
      aluno: {
        nome: { contains: name, mode: "insensitive" },
      },
      ...turmaFilter,
    },
    include: boletimInclude,
    take: lim,
    orderBy: { updatedAt: "desc" },
  });

  if (rows.length === 0) {
    return {
      error: "no_match",
      message: `Nenhuma matrícula encontrada para nome próximo a "${name}".`,
      filtros: { activeOnly, turmaSearch: args.turmaSearch ?? null },
    };
  }

  if (rows.length > 1) {
    return {
      ambiguous: true,
      total: rows.length,
      opcoes: rows.map((r) => ({
        matriculaId: r.id,
        status: r.status,
        aluno: r.aluno.nome,
        turma: r.turma.nome,
      })),
      instrucao:
        "Peça ao usuário qual turma ou copie matriculaId exato para consultar o boletim completo.",
    };
  }

  const row = rows[0];
  return {
    matriculaId: row.id,
    status: row.status,
    aluno: row.aluno,
    turma: row.turma,
    disciplinas: aggregateBoletim(row as MatriculaBoletimRow),
  };
}
