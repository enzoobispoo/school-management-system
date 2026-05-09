import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { AuthenticatedUser } from "@/lib/auth/get-current-user";
import { getCurrentUser, requireSchool } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchHit = {
  id: string;
  type: "aluno" | "curso" | "professor" | "pagamento" | "avaliacao";
  label: string;
  description: string;
  href: string;
};

async function searchProfessorScoped(
  user: AuthenticatedUser,
  schoolId: string,
  query: string
): Promise<SearchHit[]> {
  if (!user.professorId) {
    return [];
  }

  const turmas = await prisma.turma.findMany({
    where: {
      schoolId,
      professorId: user.professorId,
      ativo: true,
    },
    select: { id: true, cursoId: true },
  });

  const turmaIds = turmas.map((t) => t.id);
  const cursoIds = [...new Set(turmas.map((t) => t.cursoId))];

  const orAluno = [
    { nome: { contains: query, mode: "insensitive" as const } },
    { email: { contains: query, mode: "insensitive" as const } },
    { telefone: { contains: query, mode: "insensitive" as const } },
    { cpf: { contains: query, mode: "insensitive" as const } },
  ];

  const orCurso = [
    { nome: { contains: query, mode: "insensitive" as const } },
    { categoria: { contains: query, mode: "insensitive" as const } },
    { descricao: { contains: query, mode: "insensitive" as const } },
  ];

  const orProfessorSelf = [
    { nome: { contains: query, mode: "insensitive" as const } },
    { email: { contains: query, mode: "insensitive" as const } },
    { telefone: { contains: query, mode: "insensitive" as const } },
  ];

  const [alunos, cursos, selfProfessor, avaliacoes] = await Promise.all([
    turmaIds.length === 0
      ? Promise.resolve([])
      : prisma.aluno.findMany({
          where: {
            schoolId,
            OR: orAluno,
            matriculas: {
              some: {
                schoolId,
                status: "ATIVA",
                turmaId: { in: turmaIds },
              },
            },
          },
          take: 5,
          select: {
            id: true,
            nome: true,
            email: true,
          },
          orderBy: { nome: "asc" },
        }),

    cursoIds.length === 0
      ? Promise.resolve([])
      : prisma.curso.findMany({
          where: {
            schoolId,
            id: { in: cursoIds },
            OR: orCurso,
          },
          take: 5,
          select: {
            id: true,
            nome: true,
            categoria: true,
          },
          orderBy: { nome: "asc" },
        }),

    prisma.professor.findFirst({
      where: {
        schoolId,
        id: user.professorId,
        OR: orProfessorSelf,
      },
      select: {
        id: true,
        nome: true,
        email: true,
      },
    }),

    prisma.avaliacao.findMany({
      where: {
        schoolId,
        professorId: user.professorId,
        deletedAt: null,
        OR: [
          { titulo: { contains: query, mode: "insensitive" } },
          { descricao: { contains: query, mode: "insensitive" } },
          {
            questoes: {
              some: { enunciado: { contains: query, mode: "insensitive" } },
            },
          },
          {
            notas: {
              some: {
                matricula: {
                  aluno: { nome: { contains: query, mode: "insensitive" } },
                },
              },
            },
          },
        ],
      },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        turma: { select: { nome: true } },
        disciplina: { select: { nome: true } },
        questoes: { select: { enunciado: true }, orderBy: { ordem: "asc" }, take: 1 },
      },
    }),
  ]);

  /** `/alunos` e `/cursos` não estão liberados no proxy para PROFESSOR — até haver ficha no painel docente. */
  const results: SearchHit[] = [
    ...alunos.map((item) => ({
      id: item.id,
      type: "aluno" as const,
      label: item.nome,
      description: item.email || "Aluno",
      href: "/docente",
    })),

    ...cursos.map((item) => ({
      id: item.id,
      type: "curso" as const,
      label: item.nome,
      description: item.categoria || "Curso",
      href: "/docente",
    })),
    ...avaliacoes.map((item) => ({
      id: item.id,
      type: "avaliacao" as const,
      label: item.titulo,
      description:
        `${item.turma.nome} • ${item.disciplina.nome}` +
        (item.questoes[0]?.enunciado ? ` • ${item.questoes[0].enunciado}` : ""),
      href: `/docente/avaliacoes`,
    })),
  ];

  if (selfProfessor) {
    results.push({
      id: selfProfessor.id,
      type: "professor",
      label: selfProfessor.nome,
      description: selfProfessor.email || "Professor",
      href: `/professores?id=${selfProfessor.id}`,
    });
  }

  return results;
}

async function searchFinanceScoped(
  schoolId: string,
  query: string
): Promise<SearchHit[]> {
  const pagamentos = await prisma.pagamento.findMany({
    where: {
      schoolId,
      status: { not: "CANCELADO" },
      OR: [
        { descricao: { contains: query, mode: "insensitive" } },
        {
          matricula: {
            aluno: {
              nome: { contains: query, mode: "insensitive" },
            },
          },
        },
        {
          matricula: {
            turma: {
              curso: {
                nome: { contains: query, mode: "insensitive" },
              },
            },
          },
        },
      ],
    },
    take: 12,
    include: {
      matricula: {
        include: {
          aluno: true,
          turma: {
            include: {
              curso: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return pagamentos.map((item) => ({
    id: item.id,
    type: "pagamento" as const,
    label: `${item.matricula.aluno.nome} — ${item.descricao}`,
    description: item.matricula.turma.curso.nome,
    href: `/financeiro/cobrancas?paymentId=${item.id}`,
  }));
}

async function searchSchoolStaffScoped(
  schoolId: string,
  query: string
): Promise<SearchHit[]> {
  const [alunos, cursos, professores, pagamentos, avaliacoes] = await Promise.all([
    prisma.aluno.findMany({
      where: {
        schoolId,
        OR: [
          { nome: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { telefone: { contains: query, mode: "insensitive" } },
          { cpf: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        nome: true,
        email: true,
      },
      orderBy: { nome: "asc" },
    }),

    prisma.curso.findMany({
      where: {
        schoolId,
        OR: [
          { nome: { contains: query, mode: "insensitive" } },
          { categoria: { contains: query, mode: "insensitive" } },
          { descricao: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        nome: true,
        categoria: true,
      },
      orderBy: { nome: "asc" },
    }),

    prisma.professor.findMany({
      where: {
        schoolId,
        OR: [
          { nome: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { telefone: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        nome: true,
        email: true,
      },
      orderBy: { nome: "asc" },
    }),

    prisma.pagamento.findMany({
      where: {
        schoolId,
        OR: [
          { descricao: { contains: query, mode: "insensitive" } },
          {
            matricula: {
              aluno: {
                nome: { contains: query, mode: "insensitive" },
              },
            },
          },
          {
            matricula: {
              turma: {
                curso: {
                  nome: { contains: query, mode: "insensitive" },
                },
              },
            },
          },
        ],
      },
      take: 5,
      include: {
        matricula: {
          include: {
            aluno: true,
            turma: {
              include: {
                curso: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.avaliacao.findMany({
      where: {
        schoolId,
        deletedAt: null,
        OR: [
          { titulo: { contains: query, mode: "insensitive" } },
          { descricao: { contains: query, mode: "insensitive" } },
          {
            questoes: {
              some: { enunciado: { contains: query, mode: "insensitive" } },
            },
          },
          {
            notas: {
              some: {
                matricula: { aluno: { nome: { contains: query, mode: "insensitive" } } },
              },
            },
          },
        ],
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        turma: { select: { nome: true } },
        disciplina: { select: { nome: true } },
      },
    }),
  ]);

  return [
    ...alunos.map((item) => ({
      id: item.id,
      type: "aluno" as const,
      label: item.nome,
      description: item.email || "Aluno",
      href: `/alunos?id=${item.id}`,
    })),

    ...cursos.map((item) => ({
      id: item.id,
      type: "curso" as const,
      label: item.nome,
      description: item.categoria || "Curso",
      href: `/cursos?id=${item.id}`,
    })),

    ...professores.map((item) => ({
      id: item.id,
      type: "professor" as const,
      label: item.nome,
      description: item.email || "Professor",
      href: `/professores?id=${item.id}`,
    })),

    ...pagamentos.map((item) => ({
      id: item.id,
      type: "pagamento" as const,
      label: `${item.matricula.aluno.nome} — ${item.descricao}`,
      description: item.matricula.turma.curso.nome,
      href: `/financeiro/cobrancas?paymentId=${item.id}`,
    })),
    ...avaliacoes.map((item) => ({
      id: item.id,
      type: "avaliacao" as const,
      label: item.titulo,
      description: `${item.turma.nome} • ${item.disciplina.nome}`,
      href: "/docente/avaliacoes",
    })),
  ];
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const query = request.nextUrl.searchParams.get("q")?.trim() || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results =
      user.role === "PROFESSOR"
        ? await searchProfessorScoped(user, schoolId, query)
        : user.role === "FINANCEIRO"
          ? await searchFinanceScoped(schoolId, query)
        : await searchSchoolStaffScoped(schoolId, query);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Erro na busca global:", error);

    return NextResponse.json(
      { error: "Não foi possível realizar a busca." },
      { status: 500 }
    );
  }
}
