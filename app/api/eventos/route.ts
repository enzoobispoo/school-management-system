import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma, TipoEvento } from "@prisma/client"
import { z } from "zod"
import { getCurrentUser, requireSchool } from "@/lib/auth"
import { blockProfessorWhenPortalDisabled } from "@/lib/docente/professor-portal-policy"

const createEventoSchema = z.object({
  titulo: z.string().min(2, "Título é obrigatório"),
  descricao: z.string().optional(),
  tipo: z.nativeEnum(TipoEvento).default(TipoEvento.GERAL),
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date(),
  diaInteiro: z.coerce.boolean().optional().default(false),
  cor: z.string().optional(),
  local: z.string().optional(),
  professorId: z.string().optional(),
  turmaId: z.string().optional(),
  cursoId: z.string().optional(),
  ativo: z.coerce.boolean().optional().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const portalDenied = await blockProfessorWhenPortalDisabled(user);
    if (portalDenied) return portalDenied;

    const body = await request.json()
    const parsed = createEventoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    if (parsed.data.dataFim <= parsed.data.dataInicio) {
      return NextResponse.json(
        { error: "A data/hora final deve ser maior que a inicial" },
        { status: 400 }
      )
    }

    const evento = await prisma.evento.create({
      data: {
        schoolId,
        titulo: parsed.data.titulo,
        descricao: parsed.data.descricao,
        tipo: parsed.data.tipo,
        dataInicio: parsed.data.dataInicio,
        dataFim: parsed.data.dataFim,
        diaInteiro: parsed.data.diaInteiro,
        cor: parsed.data.cor,
        local: parsed.data.local,
        professorId: parsed.data.professorId,
        turmaId: parsed.data.turmaId,
        cursoId: parsed.data.cursoId,
        ativo: parsed.data.ativo,
      },
      include: {
        professor: true,
        turma: true,
        curso: true,
      },
    })

    return NextResponse.json(evento, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar evento:", error)

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "Professor, turma ou curso informado é inválido" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erro ao criar evento" },
      { status: 500 }
    )
  }
}