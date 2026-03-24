import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateProfessorSchema } from "@/lib/validations/professor"
import { Prisma } from "@prisma/client"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const professor = await prisma.professor.findUnique({
      where: { id },
      include: {
        turmas: {
          include: {
            curso: true,
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

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      )
    }

    const cursosUnicos = Array.from(
      new Map(
        professor.turmas.map((turma) => [
          turma.curso.id,
          {
            id: turma.curso.id,
            nome: turma.curso.nome,
            categoria: turma.curso.categoria,
            valorMensal: Number(turma.curso.valorMensal),
            duracaoTexto: turma.curso.duracaoTexto,
          },
        ])
      ).values()
    )

    const response = {
      id: professor.id,
      nome: professor.nome,
      email: professor.email,
      telefone: professor.telefone,
      ativo: professor.ativo,
      createdAt: professor.createdAt,
      updatedAt: professor.updatedAt,
      cursos: cursosUnicos,
      totalTurmas: professor.turmas.length,
      totalAlunos: professor.turmas.reduce(
        (acc, turma) =>
          acc + turma.matriculas.filter((m) => m.status === "ATIVA").length,
        0
      ),
      turmas: professor.turmas.map((turma) => ({
        id: turma.id,
        nome: turma.nome,
        capacidadeMaxima: turma.capacidadeMaxima,
        ativo: turma.ativo,
        curso: {
          id: turma.curso.id,
          nome: turma.curso.nome,
          categoria: turma.curso.categoria,
          valorMensal: Number(turma.curso.valorMensal),
          duracaoTexto: turma.curso.duracaoTexto,
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
      agenda: professor.turmas.flatMap((turma) =>
        turma.horarios.map((horario) => ({
          turmaId: turma.id,
          turmaNome: turma.nome,
          cursoId: turma.curso.id,
          cursoNome: turma.curso.nome,
          diaSemana: horario.diaSemana,
          horaInicio: horario.horaInicio,
          horaFim: horario.horaFim,
        }))
      ),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Erro ao buscar professor:", error)

    return NextResponse.json(
      { error: "Erro ao buscar professor" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const parsed = updateProfessorSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const professorExistente = await prisma.professor.findUnique({
      where: { id },
      select: { id: true, nome: true, ativo: true },
    })

    if (!professorExistente) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      )
    }

    const professor = await prisma.professor.update({
      where: { id },
      data: {
        ...(parsed.data.nome !== undefined ? { nome: parsed.data.nome } : {}),
        ...(parsed.data.email !== undefined ? { email: parsed.data.email } : {}),
        ...(parsed.data.telefone !== undefined
          ? { telefone: parsed.data.telefone?.replace(/\D/g, "") }
          : {}),
        ...(parsed.data.ativo !== undefined ? { ativo: parsed.data.ativo } : {}),
      },
    })

    return NextResponse.json(professor)
  } catch (error) {
    console.error("Erro ao atualizar professor:", error)

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Já existe um professor com esse e-mail" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Erro ao atualizar professor" },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const professor = await prisma.professor.findUnique({
      where: { id },
      include: {
        turmas: {
          select: { id: true },
        },
      },
    })

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      )
    }

    if (professor.turmas.length > 0) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir um professor vinculado a turmas. Reatribua ou desative as turmas antes.",
        },
        { status: 400 }
      )
    }

    await prisma.professor.delete({
      where: { id },
    })

    return NextResponse.json({
      message: "Professor excluído com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir professor:", error)

    return NextResponse.json(
      { error: "Erro ao excluir professor" },
      { status: 500 }
    )
  }
}