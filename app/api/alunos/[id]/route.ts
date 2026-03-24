import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateAlunoSchema } from "@/lib/validations/aluno"
import { Prisma } from "@prisma/client"

function getComputedPaymentStatus(pagamento: {
  status: string
  vencimento: Date
  dataPagamento: Date | null
}) {
  if (pagamento.status === "CANCELADO") return "CANCELADO"
  if (pagamento.status === "PAGO" || pagamento.dataPagamento) return "PAGO"

  const hoje = new Date()
  const vencimento = new Date(pagamento.vencimento)

  hoje.setHours(0, 0, 0, 0)
  vencimento.setHours(0, 0, 0, 0)

  if (vencimento < hoje) return "ATRASADO"
  return "PENDENTE"
}

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const aluno = await prisma.aluno.findUnique({
      where: { id },
      include: {
        matriculas: {
          include: {
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
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      )
    }

    const response = {
      id: aluno.id,
      cpf: aluno.cpf,
      nome: aluno.nome,
      email: aluno.email,
      telefone: aluno.telefone,
      dataNascimento: aluno.dataNascimento,
      endereco: aluno.endereco,
      status: aluno.status,
      createdAt: aluno.createdAt,
      updatedAt: aluno.updatedAt,
      matriculas: aluno.matriculas.map((matricula) => ({
        id: matricula.id,
        status: matricula.status,
        dataMatricula: matricula.dataMatricula,
        dataCancelamento: matricula.dataCancelamento,
        motivoCancelamento: matricula.motivoCancelamento,
        observacoes: matricula.observacoes,
        turma: {
          id: matricula.turma.id,
          nome: matricula.turma.nome,
          capacidadeMaxima: matricula.turma.capacidadeMaxima,
          ativo: matricula.turma.ativo,
          curso: {
            id: matricula.turma.curso.id,
            nome: matricula.turma.curso.nome,
            categoria: matricula.turma.curso.categoria,
            valorMensal: Number(matricula.turma.curso.valorMensal),
            duracaoTexto: matricula.turma.curso.duracaoTexto,
          },
          professor: {
            id: matricula.turma.professor.id,
            nome: matricula.turma.professor.nome,
            email: matricula.turma.professor.email,
            telefone: matricula.turma.professor.telefone,
          },
          horarios: matricula.turma.horarios,
        },
        pagamentos: matricula.pagamentos.map((pagamento) => ({
          id: pagamento.id,
          descricao: pagamento.descricao,
          valor: Number(pagamento.valor),
          status: getComputedPaymentStatus(pagamento),
          vencimento: pagamento.vencimento,
          dataPagamento: pagamento.dataPagamento,
          competenciaMes: pagamento.competenciaMes,
          competenciaAno: pagamento.competenciaAno,
          metodoPagamento: pagamento.metodoPagamento,
          observacoes: pagamento.observacoes,
        })),
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Erro ao buscar aluno:", error)

    return NextResponse.json(
      { error: "Erro ao buscar aluno" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const parsed = updateAlunoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const alunoExistente = await prisma.aluno.findUnique({
      where: { id },
      select: { id: true, nome: true },
    })

    if (!alunoExistente) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      )
    }

    const aluno = await prisma.aluno.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json(aluno)
  } catch (error) {
    console.error("Erro ao atualizar aluno:", error)

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Já existe um aluno com esse e-mail ou CPF" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Erro ao atualizar aluno" },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const aluno = await prisma.aluno.findUnique({
      where: { id },
      include: {
        matriculas: {
          where: {
            status: {
              in: ["ATIVA", "TRANCADA"],
            },
          },
        },
      },
    })

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      )
    }

    if (aluno.matriculas.length > 0) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir um aluno com matrículas ativas ou trancadas",
        },
        { status: 400 }
      )
    }

    await prisma.aluno.delete({
      where: { id },
    })

    return NextResponse.json({
      message: "Aluno excluído com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir aluno:", error)

    return NextResponse.json(
      { error: "Erro ao excluir aluno" },
      { status: 500 }
    )
  }
}