import { NextRequest, NextResponse } from "next/server"
import { Prisma, StatusPagamento } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { updatePagamentoSchema } from "@/lib/validations/pagamento"

interface RouteContext {
  params: Promise<{ id: string }>
}

function resolveStatus(
  status: StatusPagamento,
  vencimento: Date,
  dataPagamento?: Date | null
): StatusPagamento {
  if (status === "CANCELADO") return "CANCELADO"
  if (dataPagamento || status === "PAGO") return "PAGO"

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const venc = new Date(vencimento)
  venc.setHours(0, 0, 0, 0)

  return venc < hoje ? "ATRASADO" : "PENDENTE"
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const pagamento = await prisma.pagamento.findUnique({
      where: { id },
      include: {
        matricula: {
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
        },
      },
    })

    if (!pagamento) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: pagamento.id,
      descricao: pagamento.descricao,
      valor: Number(pagamento.valor),
      status: resolveStatus(
        pagamento.status,
        pagamento.vencimento,
        pagamento.dataPagamento
      ),
      vencimento: pagamento.vencimento,
      dataPagamento: pagamento.dataPagamento,
      competenciaMes: pagamento.competenciaMes,
      competenciaAno: pagamento.competenciaAno,
      metodoPagamento: pagamento.metodoPagamento,
      observacoes: pagamento.observacoes,
      createdAt: pagamento.createdAt,
      updatedAt: pagamento.updatedAt,
      matricula: {
        id: pagamento.matricula.id,
        status: pagamento.matricula.status,
        dataMatricula: pagamento.matricula.dataMatricula,
        aluno: {
          id: pagamento.matricula.aluno.id,
          nome: pagamento.matricula.aluno.nome,
          email: pagamento.matricula.aluno.email,
          telefone: pagamento.matricula.aluno.telefone,
          status: pagamento.matricula.aluno.status,
        },
        turma: {
          id: pagamento.matricula.turma.id,
          nome: pagamento.matricula.turma.nome,
          curso: {
            id: pagamento.matricula.turma.curso.id,
            nome: pagamento.matricula.turma.curso.nome,
            categoria: pagamento.matricula.turma.curso.categoria,
            valorMensal: Number(pagamento.matricula.turma.curso.valorMensal),
          },
          professor: {
            id: pagamento.matricula.turma.professor.id,
            nome: pagamento.matricula.turma.professor.nome,
          },
          horarios: pagamento.matricula.turma.horarios,
        },
      },
    })
  } catch (error) {
    console.error("Erro ao buscar pagamento:", error)
    return NextResponse.json(
      { error: "Erro ao buscar pagamento" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const parsed = updatePagamentoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const pagamentoExistente = await prisma.pagamento.findUnique({
      where: { id },
      include: {
        matricula: {
          include: {
            aluno: true,
          },
        },
      },
    })

    if (!pagamentoExistente) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      )
    }

    const competenciaMes =
      parsed.data.competenciaMes ?? pagamentoExistente.competenciaMes
    const competenciaAno =
      parsed.data.competenciaAno ?? pagamentoExistente.competenciaAno
    const vencimento = parsed.data.vencimento ?? pagamentoExistente.vencimento
    const dataPagamento =
      parsed.data.dataPagamento !== undefined
        ? parsed.data.dataPagamento
        : pagamentoExistente.dataPagamento
    const statusBase = parsed.data.status ?? pagamentoExistente.status

    const statusFinal = resolveStatus(statusBase, vencimento, dataPagamento)

    const pagamento = await prisma.pagamento.update({
      where: { id },
      data: {
        ...(parsed.data.competenciaMes !== undefined
          ? { competenciaMes: parsed.data.competenciaMes }
          : {}),
        ...(parsed.data.competenciaAno !== undefined
          ? { competenciaAno: parsed.data.competenciaAno }
          : {}),
        ...(parsed.data.descricao !== undefined
          ? { descricao: parsed.data.descricao }
          : {}),
        ...(parsed.data.valor !== undefined ? { valor: parsed.data.valor } : {}),
        ...(parsed.data.vencimento !== undefined
          ? { vencimento: parsed.data.vencimento }
          : {}),
        ...(parsed.data.dataPagamento !== undefined
          ? { dataPagamento: parsed.data.dataPagamento }
          : {}),
        ...(parsed.data.metodoPagamento !== undefined
          ? { metodoPagamento: parsed.data.metodoPagamento }
          : {}),
        ...(parsed.data.observacoes !== undefined
          ? { observacoes: parsed.data.observacoes }
          : {}),
        status: statusFinal,
      },
      include: {
        matricula: {
          include: {
            aluno: true,
            turma: {
              include: {
                curso: true,
                professor: true,
              },
            },
          },
        },
      },
    })

    if (pagamentoExistente.status !== "PAGO" && pagamento.status === "PAGO") {
      await prisma.notificacao.create({
        data: {
          tipo: "PAGAMENTO_CONFIRMADO",
          titulo: "Pagamento confirmado",
          mensagem: `Pagamento de ${pagamento.matricula.aluno.nome} foi confirmado.`,
          entidadeTipo: "PAGAMENTO",
          entidadeId: pagamento.id,
        },
      })
    }

    if (
      pagamentoExistente.status !== "ATRASADO" &&
      pagamento.status === "ATRASADO"
    ) {
      await prisma.notificacao.create({
        data: {
          tipo: "PAGAMENTO_ATRASADO",
          titulo: "Pagamento em atraso",
          mensagem: `Pagamento de ${pagamento.matricula.aluno.nome} entrou em atraso.`,
          entidadeTipo: "PAGAMENTO",
          entidadeId: pagamento.id,
        },
      })
    }

    return NextResponse.json({
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
      createdAt: pagamento.createdAt,
      updatedAt: pagamento.updatedAt,
      matricula: {
        id: pagamento.matricula.id,
        aluno: {
          id: pagamento.matricula.aluno.id,
          nome: pagamento.matricula.aluno.nome,
        },
        turma: {
          id: pagamento.matricula.turma.id,
          nome: pagamento.matricula.turma.nome,
          curso: {
            id: pagamento.matricula.turma.curso.id,
            nome: pagamento.matricula.turma.curso.nome,
          },
          professor: {
            id: pagamento.matricula.turma.professor.id,
            nome: pagamento.matricula.turma.professor.nome,
          },
        },
      },
    })
  } catch (error) {
    console.error("Erro ao atualizar pagamento:", error)

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Já existe pagamento dessa matrícula para essa competência" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Erro ao atualizar pagamento" },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const pagamento = await prisma.pagamento.findUnique({
      where: { id },
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
    })

    if (!pagamento) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      )
    }

    if (pagamento.status === "PAGO" || pagamento.dataPagamento) {
      return NextResponse.json(
        { error: "Não é possível excluir um pagamento já pago" },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.pagamento.delete({
        where: { id },
      })

      await tx.notificacao.create({
        data: {
          tipo: "SISTEMA",
          titulo: "Mensalidade excluída",
          mensagem: `A mensalidade ${pagamento.descricao} de ${pagamento.matricula.aluno.nome} foi excluída.`,
          entidadeTipo: "PAGAMENTO",
          entidadeId: pagamento.id,
        },
      })
    })

    return NextResponse.json({
      message: "Pagamento excluído com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir pagamento:", error)
    return NextResponse.json(
      { error: "Erro ao excluir pagamento" },
      { status: 500 }
    )
  }
}