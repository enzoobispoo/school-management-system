import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createCursoSchema } from "@/lib/validations/curso"
import { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const id = searchParams.get("id")?.trim() || ""
    const search = searchParams.get("search")?.trim() || ""
    const categoria = searchParams.get("categoria")?.trim() || ""
    const ativo = searchParams.get("ativo")
    const page = Math.max(Number(searchParams.get("page") || "1"), 1)
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || "12"), 1),
      100
    )

    const where: Prisma.CursoWhereInput = {
      ...(id ? { id } : {}),
      ...(categoria
        ? { categoria: { equals: categoria, mode: "insensitive" } }
        : {}),
      ...(ativo !== null ? { ativo: ativo === "true" } : {}),
      ...(search
        ? {
            OR: [
              { nome: { contains: search, mode: "insensitive" } },
              { categoria: { contains: search, mode: "insensitive" } },
              { descricao: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    }

    const [total, cursos] = await Promise.all([
      prisma.curso.count({ where }),
      prisma.curso.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          turmas: {
            include: {
              professor: true,
              matriculas: {
                where: { status: "ATIVA" },
                select: { id: true },
              },
              horarios: true,
            },
            orderBy: { nome: "asc" },
          },
        },
      }),
    ])

    const data = cursos.map((curso) => {
      const totalAlunos = curso.turmas.reduce(
        (acc, turma) => acc + turma.matriculas.length,
        0
      )

      return {
        id: curso.id,
        nome: curso.nome,
        categoria: curso.categoria,
        descricao: curso.descricao,
        duracaoTexto: curso.duracaoTexto,
        valorMensal: Number(curso.valorMensal),
        ativo: curso.ativo,
        createdAt: curso.createdAt,
        updatedAt: curso.updatedAt,
        totalAlunos,
        totalTurmas: curso.turmas.length,
        turmas: curso.turmas.map((turma) => ({
          id: turma.id,
          nome: turma.nome,
          capacidadeMaxima: turma.capacidadeMaxima,
          ativo: turma.ativo,
          totalAlunos: turma.matriculas.length,
          professor: {
            id: turma.professor.id,
            nome: turma.professor.nome,
            email: turma.professor.email,
            telefone: turma.professor.telefone,
          },
          horarios: turma.horarios,
        })),
      }
    })

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
    console.error("Erro ao buscar cursos:", error)

    return NextResponse.json(
      { error: "Erro ao buscar cursos" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createCursoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const curso = await prisma.curso.create({
      data: {
        nome: parsed.data.nome,
        categoria: parsed.data.categoria,
        descricao: parsed.data.descricao,
        duracaoTexto: parsed.data.duracaoTexto,
        valorMensal: parsed.data.valorMensal,
        ativo: parsed.data.ativo,
      },
    })

    await prisma.notificacao.create({
      data: {
        tipo: "SISTEMA",
        titulo: "Novo curso criado",
        mensagem: `O curso ${curso.nome} foi criado no sistema.`,
        entidadeTipo: "CURSO",
        entidadeId: curso.id,
      },
    })

    return NextResponse.json(
      {
        ...curso,
        valorMensal: Number(curso.valorMensal),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erro ao criar curso:", error)

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
      { error: "Erro ao criar curso" },
      { status: 500 }
    )
  }
}