import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createProfessorSchema } from "@/lib/validations/professor"
import { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get("search")?.trim() || ""
    const ativo = searchParams.get("ativo")
    const cursoId = searchParams.get("cursoId")?.trim() || ""
    const page = Math.max(Number(searchParams.get("page") || "1"), 1)
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || "12"), 1),
      100
    )

    const where: Prisma.ProfessorWhereInput = {
      ...(ativo !== null ? { ativo: ativo === "true" } : {}),
      ...(cursoId
        ? {
            turmas: {
              some: {
                cursoId,
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

    const [total, professores] = await Promise.all([
      prisma.professor.count({ where }),
      prisma.professor.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          turmas: {
            include: {
              curso: true,
              horarios: true,
              matriculas: {
                where: { status: "ATIVA" },
                select: { id: true },
              },
            },
            orderBy: { nome: "asc" },
          },
        },
      }),
    ])

    const data = professores.map((professor) => {
      const cursosUnicos = Array.from(
        new Map(
          professor.turmas.map((turma) => [
            turma.curso.id,
            {
              id: turma.curso.id,
              nome: turma.curso.nome,
              categoria: turma.curso.categoria,
            },
          ])
        ).values()
      )

      const agenda = professor.turmas.flatMap((turma) =>
        turma.horarios.map((horario) => ({
          turmaId: turma.id,
          turmaNome: turma.nome,
          cursoId: turma.curso.id,
          cursoNome: turma.curso.nome,
          diaSemana: horario.diaSemana,
          horaInicio: horario.horaInicio,
          horaFim: horario.horaFim,
        }))
      )

      return {
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
          (acc, turma) => acc + turma.matriculas.length,
          0
        ),
        turmas: professor.turmas.map((turma) => ({
          id: turma.id,
          nome: turma.nome,
          capacidadeMaxima: turma.capacidadeMaxima,
          ativo: turma.ativo,
          totalAlunos: turma.matriculas.length,
          curso: {
            id: turma.curso.id,
            nome: turma.curso.nome,
            categoria: turma.curso.categoria,
          },
          horarios: turma.horarios,
        })),
        agenda,
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
    console.error("Erro ao buscar professores:", error)

    return NextResponse.json(
      { error: "Erro ao buscar professores" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createProfessorSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const professor = await prisma.professor.create({
      data: {
        nome: parsed.data.nome,
        email: parsed.data.email,
        telefone: parsed.data.telefone,
        ativo: parsed.data.ativo,
      },
    })

    await prisma.notificacao.create({
      data: {
        tipo: "SISTEMA",
        titulo: "Novo professor cadastrado",
        mensagem: `${professor.nome} foi cadastrado no sistema.`,
        entidadeTipo: "PROFESSOR",
        entidadeId: professor.id,
      },
    })

    return NextResponse.json(professor, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar professor:", error)

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
      { error: "Erro ao criar professor" },
      { status: 500 }
    )
  }
}