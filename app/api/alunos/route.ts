import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAlunoSchema } from "@/lib/validations/aluno"
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get("search")?.trim() || ""
    const status = searchParams.get("status")?.trim()
    const page = Math.max(Number(searchParams.get("page") || "1"), 1)
    const courseId = searchParams.get("courseId")?.trim() || ""
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || "10"), 1),
      100
    )

    const where: Prisma.AlunoWhereInput = {
      ...(courseId
        ? {
            matriculas: {
              some: {
                turma: {
                  cursoId: courseId,
                },
              },
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { nome: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { telefone: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    }

    const [total, alunos] = await Promise.all([
      prisma.aluno.count({ where }),
      prisma.aluno.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          matriculas: {
            include: {
              turma: {
                include: {
                  curso: true,
                },
              },
              pagamentos: {
                orderBy: { vencimento: "desc" },
                take: 5,
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
    ])

    const data = alunos.map((aluno) => {
      const cursos = aluno.matriculas.map(
        (matricula) => matricula.turma.curso.nome
      )

      const pagamentos = aluno.matriculas.flatMap((matricula) =>
        matricula.pagamentos.map((pagamento) => ({
          id: pagamento.id,
          matriculaId: matricula.id,
          descricao: pagamento.descricao,
          valor: Number(pagamento.valor),
          status: getComputedPaymentStatus(pagamento),
          vencimento: pagamento.vencimento,
          dataPagamento: pagamento.dataPagamento,
          competenciaMes: pagamento.competenciaMes,
          competenciaAno: pagamento.competenciaAno,
        }))
      )

      return {
        id: aluno.id,
        nome: aluno.nome,
        cpf: aluno.cpf,
        email: aluno.email,
        telefone: aluno.telefone,
        dataNascimento: aluno.dataNascimento,
        endereco: aluno.endereco,
        status: aluno.status,
        createdAt: aluno.createdAt,
        updatedAt: aluno.updatedAt,
        cursos,
        matriculas: aluno.matriculas.map((matricula) => ({
          id: matricula.id,
          status: matricula.status,
          dataMatricula: matricula.dataMatricula,
          turma: {
            id: matricula.turma.id,
            nome: matricula.turma.nome,
            curso: {
              id: matricula.turma.curso.id,
              nome: matricula.turma.curso.nome,
              categoria: matricula.turma.curso.categoria,
            },
          },
        })),
        pagamentos,
      }
    })

    const filteredData = status
  ? data.filter((aluno) => {
      const paymentStatuses = aluno.pagamentos.map((pagamento) => pagamento.status)

      let financialStatus = "paid"
      if (paymentStatuses.includes("ATRASADO")) {
        financialStatus = "overdue"
      } else if (paymentStatuses.includes("PENDENTE")) {
        financialStatus = "pending"
      }

      return financialStatus === status
    })
  : data

  return NextResponse.json({
    data: filteredData,
    meta: {
      total: status ? filteredData.length : total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("Erro ao buscar alunos:", error)

    return NextResponse.json(
      { error: "Erro ao buscar alunos" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createAlunoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const aluno = await prisma.aluno.create({
      data: {
        nome: parsed.data.nome,
        email: parsed.data.email,
        cpf: parsed.data.cpf?.replace(/\D/g, ""),
        telefone: parsed.data.telefone?.replace(/\D/g, ""),
        dataNascimento: parsed.data.dataNascimento,
        endereco: parsed.data.endereco,
        status: parsed.data.status,
      },
    })

    await prisma.notificacao.create({
      data: {
        tipo: "NOVO_ALUNO",
        titulo: "Novo aluno cadastrado",
        mensagem: `${aluno.nome} foi cadastrado no sistema.`,
        entidadeTipo: "ALUNO",
        entidadeId: aluno.id,
      },
    })

    return NextResponse.json(aluno, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar aluno:", error)

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
      { error: "Erro ao criar aluno" },
      { status: 500 }
    )
  }
}