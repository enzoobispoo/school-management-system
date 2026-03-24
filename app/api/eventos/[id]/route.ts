import { NextRequest, NextResponse } from "next/server";
import { Prisma, TipoEvento } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const updateEventoSchema = z.object({
  titulo: z.string().min(2, "Título é obrigatório").optional(),
  descricao: z.string().optional(),
  tipo: z.nativeEnum(TipoEvento).optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
  diaInteiro: z.coerce.boolean().optional(),
  cor: z.string().optional(),
  local: z.string().optional(),
  professorId: z.string().optional(),
  turmaId: z.string().optional(),
  cursoId: z.string().optional(),
  ativo: z.coerce.boolean().optional(),
});

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const parsed = updateEventoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const eventoExistente = await prisma.evento.findUnique({
      where: { id },
      select: { id: true, dataInicio: true, dataFim: true },
    });

    if (!eventoExistente) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      );
    }

    const dataInicio = parsed.data.dataInicio ?? eventoExistente.dataInicio;
    const dataFim = parsed.data.dataFim ?? eventoExistente.dataFim;

    if (dataFim <= dataInicio) {
      return NextResponse.json(
        { error: "A data/hora final deve ser maior que a inicial" },
        { status: 400 }
      );
    }

    const evento = await prisma.evento.update({
      where: { id },
      data: parsed.data,
      include: {
        professor: true,
        turma: true,
        curso: true,
      },
    });

    return NextResponse.json(evento);
  } catch (error) {
    console.error("Erro ao atualizar evento:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "Professor, turma ou curso informado é inválido" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao atualizar evento" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const eventoExistente = await prisma.evento.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!eventoExistente) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      );
    }

    await prisma.evento.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Evento excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir evento:", error);

    return NextResponse.json(
      { error: "Erro ao excluir evento" },
      { status: 500 }
    );
  }
}