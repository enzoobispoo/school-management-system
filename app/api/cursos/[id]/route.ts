import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateCursoSchema } from "@/lib/validations/curso"
import { Prisma } from "@prisma/client"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const curso = await prisma.curso.findUnique({
      where: { id },
      include: {
        turmas: {
          include: {
            professor: true,
            horarios: true,
            matriculas: {
              include: {
                aluno: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { nome: "asc" },
        },
      },
    })

    if (!curso) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      )
    }

    const response = {
      id: curso.id,
      nome: curso.nome,
      categoria: curso.categoria,
      descricao: curso.descricao,
      duracaoTexto: curso.duracaoTexto,
      valorMensal: Number(curso.valorMensal),
      ativo: curso.ativo,
      createdAt: curso.createdAt,
      updatedAt: curso.updatedAt,
      totalTurmas: curso.turmas.length,
      totalAlunos: curso.turmas.reduce(
        (acc, turma) =>
          acc + turma.matriculas.filter((m) => m.status === "ATIVA").length,
        0
      ),
      turmas: curso.turmas.map((turma) => ({
        id: turma.id,
        nome: turma.nome,
        capacidadeMaxima: turma.capacidadeMaxima,
        ativo: turma.ativo,
        professor: {
          id: turma.professor.id,
          nome: turma.professor.nome,
          email: turma.professor.email,
          telefone: turma.professor.telefone,
        },
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
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Erro ao buscar curso:", error)

    return NextResponse.json(
      { error: "Erro ao buscar curso" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const parsed = updateCursoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const cursoExistente = await prisma.curso.findUnique({
      where: { id },
      select: { id: true, nome: true },
    })

    if (!cursoExistente) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      )
    }

    const curso = await prisma.curso.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({
      ...curso,
      valorMensal: Number(curso.valorMensal),
    })
  } catch (error) {
    console.error("Erro ao atualizar curso:", error)

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Já existe um curso com esse nome" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Erro ao atualizar curso" },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const curso = await prisma.curso.findUnique({
      where: { id },
      include: {
        turmas: {
          include: {
            matriculas: {
              where: {
                status: {
                  in: ["ATIVA", "TRANCADA"],
                },
              },
              select: { id: true },
            },
          },
        },
      },
    })

    if (!curso) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      )
    }

    const possuiMatriculasAtivas = curso.turmas.some(
      (turma) => turma.matriculas.length > 0
    )

    if (possuiMatriculasAtivas) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir um curso com turmas que possuem matrículas ativas ou trancadas",
        },
        { status: 400 }
      )
    }

    await prisma.curso.delete({
      where: { id },
    })

    return NextResponse.json({
      message: "Curso excluído com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir curso:", error)

    return NextResponse.json(
      { error: "Erro ao excluir curso" },
      { status: 500 }
    )
  }
}