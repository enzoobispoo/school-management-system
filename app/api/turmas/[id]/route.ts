import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { updateTurmaSchema } from "@/lib/validations/turma"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const turma = await prisma.turma.findUnique({
      where: { id },
      include: {
        curso: true,
        professor: true,
        horarios: {
          orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
        },
        matriculas: {
          include: {
            aluno: true,
            pagamentos: {
              orderBy: { vencimento: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!turma) {
      return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      id: turma.id,
      nome: turma.nome,
      capacidadeMaxima: turma.capacidadeMaxima,
      ativo: turma.ativo,
      createdAt: turma.createdAt,
      updatedAt: turma.updatedAt,
      vagasOcupadas: turma.matriculas.filter((m) => m.status === "ATIVA").length,
      vagasDisponiveis:
        turma.capacidadeMaxima -
        turma.matriculas.filter((m) => m.status === "ATIVA").length,
      curso: {
        id: turma.curso.id,
        nome: turma.curso.nome,
        categoria: turma.curso.categoria,
        descricao: turma.curso.descricao,
        duracaoTexto: turma.curso.duracaoTexto,
        valorMensal: Number(turma.curso.valorMensal),
        ativo: turma.curso.ativo,
      },
      professor: {
        id: turma.professor.id,
        nome: turma.professor.nome,
        email: turma.professor.email,
        telefone: turma.professor.telefone,
        ativo: turma.professor.ativo,
      },
      horarios: turma.horarios,
      matriculas: turma.matriculas.map((matricula) => ({
        id: matricula.id,
        status: matricula.status,
        dataMatricula: matricula.dataMatricula,
        dataCancelamento: matricula.dataCancelamento,
        motivoCancelamento: matricula.motivoCancelamento,
        observacoes: matricula.observacoes,
        aluno: {
          id: matricula.aluno.id,
          nome: matricula.aluno.nome,
          email: matricula.aluno.email,
          telefone: matricula.aluno.telefone,
          status: matricula.aluno.status,
        },
        pagamentos: matricula.pagamentos.map((pagamento) => ({
          id: pagamento.id,
          descricao: pagamento.descricao,
          valor: Number(pagamento.valor),
          status: pagamento.status,
          vencimento: pagamento.vencimento,
          dataPagamento: pagamento.dataPagamento,
          competenciaMes: pagamento.competenciaMes,
          competenciaAno: pagamento.competenciaAno,
        })),
      })),
    })
  } catch (error) {
    console.error("Erro ao buscar turma:", error)
    return NextResponse.json({ error: "Erro ao buscar turma" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const parsed = updateTurmaSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const turmaExistente = await prisma.turma.findUnique({
      where: { id },
      include: {
        matriculas: {
          where: {
            status: "ATIVA",
          },
          select: { id: true },
        },
      },
    })

    if (!turmaExistente) {
      return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 })
    }

    if (parsed.data.cursoId) {
      const curso = await prisma.curso.findUnique({
        where: { id: parsed.data.cursoId },
        select: { id: true, ativo: true },
      })

      if (!curso) {
        return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 })
      }

      if (!curso.ativo) {
        return NextResponse.json(
          { error: "Não é possível vincular a turma a um curso inativo" },
          { status: 400 }
        )
      }
    }

    if (parsed.data.professorId) {
      const professor = await prisma.professor.findUnique({
        where: { id: parsed.data.professorId },
        select: { id: true, ativo: true },
      })

      if (!professor) {
        return NextResponse.json({ error: "Professor não encontrado" }, { status: 404 })
      }

      if (!professor.ativo) {
        return NextResponse.json(
          { error: "Não é possível vincular a turma a um professor inativo" },
          { status: 400 }
        )
      }
    }

    if (
      parsed.data.capacidadeMaxima &&
      parsed.data.capacidadeMaxima < turmaExistente.matriculas.length
    ) {
      return NextResponse.json(
        {
          error:
            "A capacidade máxima não pode ser menor que a quantidade de matrículas ativas da turma",
        },
        { status: 400 }
      )
    }

    const turma = await prisma.turma.update({
      where: { id },
      data: {
        ...(parsed.data.cursoId ? { cursoId: parsed.data.cursoId } : {}),
        ...(parsed.data.professorId ? { professorId: parsed.data.professorId } : {}),
        ...(parsed.data.nome ? { nome: parsed.data.nome } : {}),
        ...(parsed.data.capacidadeMaxima
          ? { capacidadeMaxima: parsed.data.capacidadeMaxima }
          : {}),
        ...(parsed.data.ativo !== undefined ? { ativo: parsed.data.ativo } : {}),
        ...(parsed.data.horarios
          ? {
              horarios: {
                deleteMany: {},
                create: parsed.data.horarios,
              },
            }
          : {}),
      },
      include: {
        curso: true,
        professor: true,
        horarios: true,
      },
    })

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error("Erro ao atualizar turma:", error)

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Já existe uma turma com esse nome nesse curso" },
        { status: 409 }
      )
    }

    return NextResponse.json({ error: "Erro ao atualizar turma" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const turma = await prisma.turma.findUnique({
      where: { id },
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
    })

    if (!turma) {
      return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 })
    }

    if (turma.matriculas.length > 0) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir uma turma com matrículas ativas ou trancadas",
        },
        { status: 400 }
      )
    }

    await prisma.turma.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Turma excluída com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir turma:", error)
    return NextResponse.json({ error: "Erro ao excluir turma" }, { status: 500 })
  }
}