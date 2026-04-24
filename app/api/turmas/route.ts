import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createTurmaSchema } from "@/lib/validations/turma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const cursoId = searchParams.get("cursoId")?.trim() || "";
    const professorId = searchParams.get("professorId")?.trim() || "";
    const ativo = searchParams.get("ativo");
    const page = Math.max(Number(searchParams.get("page") || "1"), 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || "12"), 1),
      100
    );

    const where: Prisma.TurmaWhereInput = {
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

    const [total, turmas] = await Promise.all([
      prisma.turma.count({ where }),
      prisma.turma.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          curso: true,
          professor: true,
          horarios: {
            orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
          },
          matriculas: {
            where: { status: "ATIVA" },
            include: {
              aluno: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
    ]);

    const data = turmas.map((turma) => ({
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
    }));

    return NextResponse.json({
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
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
        where: { id: cursoId },
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
        where: { id: professorId },
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
