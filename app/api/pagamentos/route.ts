import { NextRequest, NextResponse } from "next/server"
import { Prisma, StatusPagamento } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { createPagamentoSchema } from "@/lib/validations/pagamento"

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get("search")?.trim() || ""
    const matriculaId = searchParams.get("matriculaId")?.trim() || ""
    const alunoId = searchParams.get("alunoId")?.trim() || ""
    const cursoId = searchParams.get("cursoId")?.trim() || ""
    const status = searchParams.get("status")?.trim() || ""
    const competenciaMes = searchParams.get("competenciaMes")?.trim() || ""
    const competenciaAno = searchParams.get("competenciaAno")?.trim() || ""
    const page = Math.max(Number(searchParams.get("page") || "1"), 1)
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || "10"), 1),
      100
    )

    const where: Prisma.PagamentoWhereInput = {
      ...(matriculaId ? { matriculaId } : {}),
      ...(alunoId ? { matricula: { alunoId } } : {}),
      ...(cursoId ? { matricula: { turma: { cursoId } } } : {}),
      ...(status ? { status: status as StatusPagamento } : {}),
      ...(competenciaMes ? { competenciaMes: Number(competenciaMes) } : {}),
      ...(competenciaAno ? { competenciaAno: Number(competenciaAno) } : {}),
      ...(search
        ? {
            OR: [
              { descricao: { contains: search, mode: "insensitive" } },
              { matricula: { aluno: { nome: { contains: search, mode: "insensitive" } } } },
              { matricula: { turma: { curso: { nome: { contains: search, mode: "insensitive" } } } } },
              { metodoPagamento: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    }

    const [total, pagamentos] = await Promise.all([
      prisma.pagamento.count({ where }),
      prisma.pagamento.findMany({
        where,
        orderBy: [{ vencimento: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
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
      }),
    ])

    const data = pagamentos.map((pagamento) => ({
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
      createdAt: pagamento.createdAt,
      updatedAt: pagamento.updatedAt,
      matricula: {
        id: pagamento.matricula.id,
        status: pagamento.matricula.status,
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
        },
      },
    }))

    return NextResponse.json({
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("Erro ao buscar pagamentos:", error)
    return NextResponse.json(
      { error: "Erro ao buscar pagamentos" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createPagamentoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const data = parsed.data

    const matricula = await prisma.matricula.findUnique({
      where: { id: data.matriculaId },
      include: {
        aluno: true,
        turma: {
          include: {
            curso: true,
          },
        },
      },
    })

    if (!matricula) {
      return NextResponse.json(
        { error: "Matrícula não encontrada" },
        { status: 404 }
      )
    }

    if (matricula.status === "CANCELADA") {
      return NextResponse.json(
        { error: "Não é possível criar pagamento para uma matrícula cancelada" },
        { status: 400 }
      )
    }

    const statusFinal = resolveStatus(
      data.status,
      data.vencimento,
      data.dataPagamento
    )

    const pagamento = await prisma.pagamento.create({
      data: {
        matriculaId: data.matriculaId,
        competenciaMes: data.competenciaMes,
        competenciaAno: data.competenciaAno,
        descricao: data.descricao,
        valor: data.valor,
        vencimento: data.vencimento,
        dataPagamento: statusFinal === "PAGO" ? data.dataPagamento ?? new Date() : data.dataPagamento,
        status: statusFinal,
        metodoPagamento: data.metodoPagamento,
        observacoes: data.observacoes,
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

    if (pagamento.status === "PAGO") {
      await prisma.notificacao.create({
        data: {
          tipo: "PAGAMENTO_CONFIRMADO",
          titulo: "Pagamento registrado",
          mensagem: `Pagamento de ${pagamento.matricula.aluno.nome} foi registrado com sucesso.`,
          entidadeTipo: "PAGAMENTO",
          entidadeId: pagamento.id,
        },
      })
    }

    if (pagamento.status === "ATRASADO") {
      await prisma.notificacao.create({
        data: {
          tipo: "PAGAMENTO_ATRASADO",
          titulo: "Pagamento em atraso",
          mensagem: `Pagamento de ${pagamento.matricula.aluno.nome} está em atraso.`,
          entidadeTipo: "PAGAMENTO",
          entidadeId: pagamento.id,
        },
      })
    }

    return NextResponse.json(
      {
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
          },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erro ao criar pagamento:", error)

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
      { error: "Erro ao criar pagamento" },
      { status: 500 }
    )
  }
}