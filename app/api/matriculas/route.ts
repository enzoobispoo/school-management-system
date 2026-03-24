import { NextRequest, NextResponse } from "next/server"
import { Prisma, StatusMatricula } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { createMatriculaSchema } from "@/lib/validations/matricula"

const QUANTIDADE_MENSALIDADES_INICIAIS = 3
const DIA_VENCIMENTO_PADRAO = 10

function addMonths(date: Date, months: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function calcularPrimeiroVencimento(dataBaseMatricula: Date) {
  const vencimento = new Date(
    dataBaseMatricula.getFullYear(),
    dataBaseMatricula.getMonth(),
    DIA_VENCIMENTO_PADRAO
  )

  if (dataBaseMatricula.getDate() > DIA_VENCIMENTO_PADRAO) {
    vencimento.setMonth(vencimento.getMonth() + 1)
  }

  return vencimento
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get("search")?.trim() || ""
    const alunoId = searchParams.get("alunoId")?.trim() || ""
    const turmaId = searchParams.get("turmaId")?.trim() || ""
    const cursoId = searchParams.get("cursoId")?.trim() || ""
    const status = searchParams.get("status")?.trim() || ""
    const page = Math.max(Number(searchParams.get("page") || "1"), 1)
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || "10"), 1),
      100
    )

    const where: Prisma.MatriculaWhereInput = {
      ...(alunoId ? { alunoId } : {}),
      ...(turmaId ? { turmaId } : {}),
      ...(cursoId ? { turma: { cursoId } } : {}),
      ...(status ? { status: status as StatusMatricula } : {}),
      ...(search
        ? {
            OR: [
              { aluno: { nome: { contains: search, mode: "insensitive" } } },
              { turma: { nome: { contains: search, mode: "insensitive" } } },
              { turma: { curso: { nome: { contains: search, mode: "insensitive" } } } },
            ],
          }
        : {}),
    }

    const [total, matriculas] = await Promise.all([
      prisma.matricula.count({ where }),
      prisma.matricula.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
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
      }),
    ])

    const data = matriculas.map((matricula) => ({
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
        status: pagamento.status,
        vencimento: pagamento.vencimento,
        dataPagamento: pagamento.dataPagamento,
        competenciaMes: pagamento.competenciaMes,
        competenciaAno: pagamento.competenciaAno,
      })),
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
    console.error("Erro ao buscar matrículas:", error)
    return NextResponse.json(
      { error: "Erro ao buscar matrículas" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createMatriculaSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { alunoId, turmaId, dataMatricula, observacoes, status } = parsed.data

    const [aluno, turma] = await Promise.all([
      prisma.aluno.findUnique({
        where: { id: alunoId },
        select: { id: true, nome: true, status: true },
      }),
      prisma.turma.findUnique({
        where: { id: turmaId },
        include: {
          curso: true,
          professor: true,
          matriculas: {
            where: { status: "ATIVA" },
            select: { id: true },
          },
        },
      }),
    ])

    if (!aluno) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })
    }

    if (!turma) {
      return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 })
    }

    if (aluno.status === "ARQUIVADO" || aluno.status === "INATIVO") {
      return NextResponse.json(
        { error: "Não é possível matricular um aluno inativo ou arquivado" },
        { status: 400 }
      )
    }

    if (!turma.ativo) {
      return NextResponse.json(
        { error: "Não é possível matricular em uma turma inativa" },
        { status: 400 }
      )
    }

    if (!turma.curso.ativo) {
      return NextResponse.json(
        { error: "Não é possível matricular em um curso inativo" },
        { status: 400 }
      )
    }

    if (!turma.professor.ativo) {
      return NextResponse.json(
        { error: "Não é possível matricular em uma turma com professor inativo" },
        { status: 400 }
      )
    }

    if (turma.matriculas.length >= turma.capacidadeMaxima) {
      return NextResponse.json(
        { error: "A turma já atingiu a capacidade máxima de alunos" },
        { status: 400 }
      )
    }

    const dataBaseMatricula = dataMatricula ?? new Date()

    const result = await prisma.$transaction(async (tx) => {
      const matricula = await tx.matricula.create({
        data: {
          alunoId,
          turmaId,
          dataMatricula: dataBaseMatricula,
          observacoes,
          status,
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

      const primeiroVencimento = calcularPrimeiroVencimento(dataBaseMatricula)

const pagamentos = await Promise.all(
  Array.from({ length: QUANTIDADE_MENSALIDADES_INICIAIS }).map((_, index) => {
    const vencimento = addMonths(primeiroVencimento, index)
    const competenciaMes = vencimento.getMonth() + 1
    const competenciaAno = vencimento.getFullYear()

    return tx.pagamento.create({
      data: {
        matriculaId: matricula.id,
        competenciaMes,
        competenciaAno,
        descricao: `Mensalidade ${String(competenciaMes).padStart(2, "0")}/${competenciaAno} - ${matricula.turma.curso.nome}`,
        valor: matricula.turma.curso.valorMensal,
        vencimento,
        status: "PENDENTE",
      },
    })
  })
)

      await tx.notificacao.create({
        data: {
          tipo: "NOVA_MATRICULA",
          titulo: "Nova matrícula realizada",
          mensagem: `${matricula.aluno.nome} foi matriculado na turma ${matricula.turma.nome} (${matricula.turma.curso.nome}).`,
          entidadeTipo: "MATRICULA",
          entidadeId: matricula.id,
        },
      })

      return { matricula, pagamentos }
    })

    return NextResponse.json(
      {
        id: result.matricula.id,
        status: result.matricula.status,
        dataMatricula: result.matricula.dataMatricula,
        observacoes: result.matricula.observacoes,
        createdAt: result.matricula.createdAt,
        updatedAt: result.matricula.updatedAt,
        aluno: {
          id: result.matricula.aluno.id,
          nome: result.matricula.aluno.nome,
          email: result.matricula.aluno.email,
          telefone: result.matricula.aluno.telefone,
          status: result.matricula.aluno.status,
        },
        turma: {
          id: result.matricula.turma.id,
          nome: result.matricula.turma.nome,
          capacidadeMaxima: result.matricula.turma.capacidadeMaxima,
          curso: {
            id: result.matricula.turma.curso.id,
            nome: result.matricula.turma.curso.nome,
            categoria: result.matricula.turma.curso.categoria,
            valorMensal: Number(result.matricula.turma.curso.valorMensal),
          },
          professor: {
            id: result.matricula.turma.professor.id,
            nome: result.matricula.turma.professor.nome,
          },
          horarios: result.matricula.turma.horarios,
        },
        pagamentosGerados: result.pagamentos.map((pagamento) => ({
          id: pagamento.id,
          descricao: pagamento.descricao,
          valor: Number(pagamento.valor),
          status: pagamento.status,
          vencimento: pagamento.vencimento,
          competenciaMes: pagamento.competenciaMes,
          competenciaAno: pagamento.competenciaAno,
        })),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erro ao criar matrícula:", error)

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
      { error: "Erro ao criar matrícula" },
      { status: 500 }
    )
  }
}