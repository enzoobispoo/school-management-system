import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { updateMatriculaSchema } from "@/lib/validations/matricula"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const matricula = await prisma.matricula.findUnique({
      where: { id },
      include: {
        aluno: true,
        turma: {
          include: {
            curso: true,
            professor: true,
            horarios: true,
          },
        },
        pagamentos: {
          orderBy: { vencimento: "desc" },
        },
      },
    })

    if (!matricula) {
      return NextResponse.json(
        { error: "Matrícula não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: matricula.id,
      status: matricula.status,
      dataMatricula: matricula.dataMatricula,
      dataCancelamento: matricula.dataCancelamento,
      motivoCancelamento: matricula.motivoCancelamento,
      observacoes: matricula.observacoes,
      createdAt: matricula.createdAt,
      updatedAt: matricula.updatedAt,
      aluno: {
        id: matricula.aluno.id,
        nome: matricula.aluno.nome,
        email: matricula.aluno.email,
        telefone: matricula.aluno.telefone,
        status: matricula.aluno.status,
        dataNascimento: matricula.aluno.dataNascimento,
        endereco: matricula.aluno.endereco,
      },
      turma: {
        id: matricula.turma.id,
        nome: matricula.turma.nome,
        capacidadeMaxima: matricula.turma.capacidadeMaxima,
        ativo: matricula.turma.ativo,
        curso: {
          id: matricula.turma.curso.id,
          nome: matricula.turma.curso.nome,
          categoria: matricula.turma.curso.categoria,
          descricao: matricula.turma.curso.descricao,
          duracaoTexto: matricula.turma.curso.duracaoTexto,
          valorMensal: Number(matricula.turma.curso.valorMensal),
          ativo: matricula.turma.curso.ativo,
        },
        professor: {
          id: matricula.turma.professor.id,
          nome: matricula.turma.professor.nome,
          email: matricula.turma.professor.email,
          telefone: matricula.turma.professor.telefone,
          ativo: matricula.turma.professor.ativo,
        },
        horarios: matricula.turma.horarios,
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
        metodoPagamento: pagamento.metodoPagamento,
        observacoes: pagamento.observacoes,
      })),
    })
  } catch (error) {
    console.error("Erro ao buscar matrícula:", error)
    return NextResponse.json(
      { error: "Erro ao buscar matrícula" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const parsed = updateMatriculaSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const matriculaExistente = await prisma.matricula.findUnique({
      where: { id },
      include: {
        aluno: {
          select: { id: true, nome: true, status: true },
        },
        turma: {
          include: {
            curso: true,
            professor: true,
          },
        },
        pagamentos: {
          where: {
            status: {
              in: ["PENDENTE", "ATRASADO"],
            },
          },
          select: { id: true },
        },
      },
    })

    if (!matriculaExistente) {
      return NextResponse.json(
        { error: "Matrícula não encontrada" },
        { status: 404 }
      )
    }

    if (parsed.data.turmaId && parsed.data.turmaId !== matriculaExistente.turmaId) {
      const novaTurma = await prisma.turma.findUnique({
        where: { id: parsed.data.turmaId },
        include: {
          curso: true,
          professor: true,
          matriculas: {
            where: { status: "ATIVA" },
            select: { id: true },
          },
        },
      })

      if (!novaTurma) {
        return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 })
      }

      if (!novaTurma.ativo || !novaTurma.curso.ativo || !novaTurma.professor.ativo) {
        return NextResponse.json(
          { error: "A nova turma precisa estar ativa, com curso e professor ativos" },
          { status: 400 }
        )
      }

      if (novaTurma.matriculas.length >= novaTurma.capacidadeMaxima) {
        return NextResponse.json(
          { error: "A nova turma já atingiu a capacidade máxima" },
          { status: 400 }
        )
      }
    }

    if (
      parsed.data.status === "CANCELADA" &&
      !parsed.data.dataCancelamento &&
      !matriculaExistente.dataCancelamento
    ) {
      parsed.data.dataCancelamento = new Date()
    }

    if (
      parsed.data.status &&
      parsed.data.status !== "CANCELADA" &&
      parsed.data.dataCancelamento
    ) {
      return NextResponse.json(
        { error: "Data de cancelamento só pode ser informada para matrícula cancelada" },
        { status: 400 }
      )
    }

    const matricula = await prisma.matricula.update({
      where: { id },
      data: {
        ...(parsed.data.turmaId ? { turmaId: parsed.data.turmaId } : {}),
        ...(parsed.data.dataMatricula ? { dataMatricula: parsed.data.dataMatricula } : {}),
        ...(parsed.data.dataCancelamento !== undefined
          ? { dataCancelamento: parsed.data.dataCancelamento }
          : {}),
        ...(parsed.data.motivoCancelamento !== undefined
          ? { motivoCancelamento: parsed.data.motivoCancelamento }
          : {}),
        ...(parsed.data.observacoes !== undefined
          ? { observacoes: parsed.data.observacoes }
          : {}),
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
      },
      include: {
        aluno: true,
        turma: {
          include: {
            curso: true,
            professor: true,
            horarios: true,
          },
        },
      },
    })

    if (parsed.data.status === "CANCELADA") {
      await prisma.notificacao.create({
        data: {
          tipo: "MATRICULA_CANCELADA",
          titulo: "Matrícula cancelada",
          mensagem: `A matrícula de ${matricula.aluno.nome} na turma ${matricula.turma.nome} foi cancelada.`,
          entidadeTipo: "MATRICULA",
          entidadeId: matricula.id,
        },
      })
    }

    return NextResponse.json({
      id: matricula.id,
      status: matricula.status,
      dataMatricula: matricula.dataMatricula,
      dataCancelamento: matricula.dataCancelamento,
      motivoCancelamento: matricula.motivoCancelamento,
      observacoes: matricula.observacoes,
      createdAt: matricula.createdAt,
      updatedAt: matricula.updatedAt,
      aluno: {
        id: matricula.aluno.id,
        nome: matricula.aluno.nome,
        email: matricula.aluno.email,
        telefone: matricula.aluno.telefone,
        status: matricula.aluno.status,
      },
      turma: {
        id: matricula.turma.id,
        nome: matricula.turma.nome,
        capacidadeMaxima: matricula.turma.capacidadeMaxima,
        curso: {
          id: matricula.turma.curso.id,
          nome: matricula.turma.curso.nome,
          categoria: matricula.turma.curso.categoria,
          valorMensal: Number(matricula.turma.curso.valorMensal),
        },
        professor: {
          id: matricula.turma.professor.id,
          nome: matricula.turma.professor.nome,
        },
        horarios: matricula.turma.horarios,
      },
    })
  } catch (error) {
    console.error("Erro ao atualizar matrícula:", error)

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Esse aluno já está matriculado nessa turma" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Erro ao atualizar matrícula" },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const matricula = await prisma.matricula.findUnique({
      where: { id },
      include: {
        pagamentos: {
          where: {
            status: {
              in: ["PENDENTE", "ATRASADO", "PAGO"],
            },
          },
          select: { id: true },
        },
      },
    })

    if (!matricula) {
      return NextResponse.json(
        { error: "Matrícula não encontrada" },
        { status: 404 }
      )
    }

    if (matricula.pagamentos.length > 0) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir uma matrícula que já possui pagamentos vinculados",
        },
        { status: 400 }
      )
    }

    await prisma.matricula.delete({
      where: { id },
    })

    return NextResponse.json({
      message: "Matrícula excluída com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir matrícula:", error)
    return NextResponse.json(
      { error: "Erro ao excluir matrícula" },
      { status: 500 }
    )
  }
}