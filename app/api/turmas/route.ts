import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createTurmaSchema } from "@/lib/validations/turma";
import { getCurrentUser, requireSchool } from "@/lib/auth";

const turmaListInclude = {
  curso: true,
  professor: true,
  horarios: {
    orderBy: [{ diaSemana: "asc" as const }, { horaInicio: "asc" as const }],
  },
  matriculas: {
    where: { status: "ATIVA" as const },
    include: { aluno: true },
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.TurmaInclude;

type TurmaListRow = Prisma.TurmaGetPayload<{ include: typeof turmaListInclude }>;

function serializeTurmaListItem(turma: TurmaListRow) {
  return {
    id: turma.id,
    nome: turma.nome,
    capacidadeMaxima: turma.capacidadeMaxima,
    ativo: turma.ativo,
    createdAt: turma.createdAt,
    updatedAt: turma.updatedAt,
    vagasOcupadas: turma.matriculas.length,
    vagasDisponiveis: turma.capacidadeMaxima - turma.matriculas.length,
    curso: {
      id: turma.curso.id,
      nome: turma.curso.nome,
      categoria: turma.curso.categoria,
      valorMensal: Number(turma.curso.valorMensal),
      duracaoTexto: turma.curso.duracaoTexto,
    },
    professor: turma.professor
      ? {
          id: turma.professor.id,
          nome: turma.professor.nome,
          email: turma.professor.email,
          telefone: turma.professor.telefone,
        }
      : null,
    horarios: turma.horarios,
    matriculas: turma.matriculas.map((matricula) => ({
      id: matricula.id,
      status: matricula.status,
      dataMatricula: matricula.dataMatricula,
      aluno: {
        id: matricula.aluno.id,
        nome: matricula.aluno.nome,
        email: matricula.aluno.email,
        telefone: matricula.aluno.telefone,
        status: matricula.aluno.status,
      },
    })),
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const cursoId = searchParams.get("cursoId")?.trim() || "";
    const professorId = searchParams.get("professorId")?.trim() || "";
    const ativo = searchParams.get("ativo");
    const ocupacaoRaw = searchParams.get("ocupacao")?.trim().toLowerCase() ?? "";
    const ocupacao =
      ocupacaoRaw === "lotadas" || ocupacaoRaw === "ociosas" ? ocupacaoRaw : "";
    const page = Math.max(Number(searchParams.get("page") || "1"), 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || "12"), 1),
      100
    );

    const baseWhere: Prisma.TurmaWhereInput = {
      schoolId,
      ...(cursoId ? { cursoId } : {}),
      ...(professorId ? { professorId } : {}),
      ...(ativo !== null ? { ativo: ativo === "true" } : {}),
      ...(search
        ? {
            OR: [
              { nome: { contains: search, mode: "insensitive" } },
              { curso: { nome: { contains: search, mode: "insensitive" } } },
              {
                professor: { nome: { contains: search, mode: "insensitive" } },
              },
            ],
          }
        : {}),
    };

    if (!ocupacao) {
      const [total, turmas] = await Promise.all([
        prisma.turma.count({ where: baseWhere }),
        prisma.turma.findMany({
          where: baseWhere,
          orderBy: [{ createdAt: "desc" }],
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: turmaListInclude,
        }),
      ]);

      return NextResponse.json({
        data: turmas.map(serializeTurmaListItem),
        meta: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || (total > 0 ? 1 : 0),
        },
      });
    }

    const candidates = await prisma.turma.findMany({
      where: baseWhere,
      select: { id: true, capacidadeMaxima: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    if (candidates.length === 0) {
      return NextResponse.json({
        data: [],
        meta: { total: 0, page: 1, pageSize, totalPages: 0 },
      });
    }

    const candidateIds = candidates.map((c) => c.id);
    const countRows = await prisma.matricula.groupBy({
      by: ["turmaId"],
      where: {
        schoolId,
        turmaId: { in: candidateIds },
        status: "ATIVA",
      },
      _count: { id: true },
    });
    const activeByTurma = new Map(
      countRows.map((r) => [r.turmaId, r._count.id])
    );

    const filtered = candidates.filter((c) => {
      const occ = activeByTurma.get(c.id) ?? 0;
      const cap = c.capacidadeMaxima;
      if (ocupacao === "lotadas") return cap > 0 && occ >= cap;
      return occ < cap;
    });

    const total = filtered.length;
    const slice = filtered.slice((page - 1) * pageSize, page * pageSize);
    const pageIds = slice.map((c) => c.id);

    if (pageIds.length === 0) {
      return NextResponse.json({
        data: [],
        meta: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || (total > 0 ? 1 : 0),
        },
      });
    }

    const turmas = await prisma.turma.findMany({
      where: { id: { in: pageIds }, schoolId },
      include: turmaListInclude,
    });

    const order = new Map(pageIds.map((id, i) => [id, i]));
    turmas.sort((a, b) => (order.get(a.id)! - order.get(b.id)!));

    return NextResponse.json({
      data: turmas.map(serializeTurmaListItem),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || (total > 0 ? 1 : 0),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar turmas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar turmas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const body = await request.json();
    const parsed = createTurmaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { cursoId, professorId, nome, capacidadeMaxima, ativo, horarios } =
      parsed.data;

    const [curso, professor] = await Promise.all([
      prisma.curso.findUnique({
        where: {
          schoolId, id: cursoId },
        select: {
          id: true,
          nome: true,
          ativo: true,
          categoria: true,
          valorMensal: true,
          duracaoTexto: true,
        },
      }),
      prisma.professor.findUnique({
        where: {
          schoolId, id: professorId },
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          ativo: true,
        },
      }),
    ]);

    if (!curso) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      );
    }

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    if (!curso.ativo) {
      return NextResponse.json(
        { error: "Não é possível criar turma para um curso inativo" },
        { status: 400 }
      );
    }

    if (!professor.ativo) {
      return NextResponse.json(
        { error: "Não é possível criar turma com um professor inativo" },
        { status: 400 }
      );
    }

    const turma = await prisma.$transaction(async (tx) => {
      const novaTurma = await tx.turma.create({
        data: {
          schoolId,
          cursoId,
          professorId,
          nome,
          capacidadeMaxima,
          ativo,
          horarios: {
            create: horarios,
          },
        },
        include: {
          curso: true,
          professor: true,
          horarios: true,
        },
      });

      await tx.turmaProfessorHistorico.create({
        data: {
          turmaId: novaTurma.id,
          professorId,
          dataInicio: new Date(),
          motivoTroca: "Professor inicial",
        },
      });

      await tx.notificacao.create({
        data: {
          schoolId,
          tipo: "SISTEMA",
          titulo: "Nova turma criada",
          mensagem: `A turma ${novaTurma.nome} foi criada para o curso ${novaTurma.curso.nome}.`,
          entidadeTipo: "TURMA",
          entidadeId: novaTurma.id,
        },
      });

      return novaTurma;
    });

    return NextResponse.json(
      {
        id: turma.id,
        nome: turma.nome,
        capacidadeMaxima: turma.capacidadeMaxima,
        ativo: turma.ativo,
        createdAt: turma.createdAt,
        updatedAt: turma.updatedAt,
        curso: {
          id: turma.curso.id,
          nome: turma.curso.nome,
          categoria: turma.curso.categoria,
          valorMensal: Number(turma.curso.valorMensal),
          duracaoTexto: turma.curso.duracaoTexto,
        },
        professor: {
          id: turma.professor.id,
          nome: turma.professor.nome,
          email: turma.professor.email,
          telefone: turma.professor.telefone,
        },
        horarios: turma.horarios,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar turma:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Já existe uma turma com esse nome nesse curso" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Erro ao criar turma" }, { status: 500 });
  }
}
