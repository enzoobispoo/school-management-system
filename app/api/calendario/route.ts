import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DiaSemana, TipoEvento } from "@prisma/client"

const DAY_INDEX_TO_ENUM: Record<number, DiaSemana> = {
  0: "DOMINGO",
  1: "SEGUNDA",
  2: "TERCA",
  3: "QUARTA",
  4: "QUINTA",
  5: "SEXTA",
  6: "SABADO",
}

function parseDate(value: string | null, fallback: Date) {
  if (!value) return fallback
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function combineDateAndTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  const d = new Date(date)
  d.setHours(hours || 0, minutes || 0, 0, 0)
  return d
}

function eachDayBetween(start: Date, end: Date) {
  const dates: Date[] = []
  const current = startOfDay(start)
  const last = startOfDay(end)

  while (current <= last) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const now = new Date()
    const defaultStart = startOfDay(now)
    const defaultEnd = endOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30))

    const start = startOfDay(parseDate(searchParams.get("start"), defaultStart))
    const end = endOfDay(parseDate(searchParams.get("end"), defaultEnd))

    const professorId = searchParams.get("professorId")?.trim() || ""
    const turmaId = searchParams.get("turmaId")?.trim() || ""
    const cursoId = searchParams.get("cursoId")?.trim() || ""
    const tipo = searchParams.get("tipo")?.trim() || ""

    const [manualEvents, turmas] = await Promise.all([
      prisma.evento.findMany({
        where: {
          ativo: true,
          dataInicio: { lte: end },
          dataFim: { gte: start },
          ...(professorId ? { professorId } : {}),
          ...(turmaId ? { turmaId } : {}),
          ...(cursoId ? { cursoId } : {}),
          ...(tipo ? { tipo: tipo as TipoEvento } : {}),
        },
        orderBy: { dataInicio: "asc" },
        include: {
          professor: true,
          turma: true,
          curso: true,
        },
      }),
      prisma.turma.findMany({
        where: {
          ativo: true,
          ...(professorId ? { professorId } : {}),
          ...(turmaId ? { id: turmaId } : {}),
          ...(cursoId ? { cursoId } : {}),
          professor: { ativo: true },
          curso: { ativo: true },
        },
        include: {
          curso: true,
          professor: true,
          horarios: true,
        },
      }),
    ])

    const manual = manualEvents.map((evento) => ({
      id: evento.id,
      source: "manual" as const,
      title: evento.titulo,
      description: evento.descricao,
      type: evento.tipo,
      start: evento.dataInicio,
      end: evento.dataFim,
      allDay: evento.diaInteiro,
      color: evento.cor,
      location: evento.local,
      professor: evento.professor
        ? {
            id: evento.professor.id,
            nome: evento.professor.nome,
          }
        : null,
      turma: evento.turma
        ? {
            id: evento.turma.id,
            nome: evento.turma.nome,
          }
        : null,
      curso: evento.curso
        ? {
            id: evento.curso.id,
            nome: evento.curso.nome,
            categoria: evento.curso.categoria,
          }
        : null,
    }))

    const days = eachDayBetween(start, end)

    const automatic = turmas.flatMap((turma) =>
      turma.horarios.flatMap((horario) =>
        days
          .filter((day) => DAY_INDEX_TO_ENUM[day.getDay()] === horario.diaSemana)
          .map((day) => {
            const startDate = combineDateAndTime(day, horario.horaInicio)
            const endDate = combineDateAndTime(day, horario.horaFim)

            return {
              id: `auto-${turma.id}-${horario.id}-${day.toISOString().slice(0, 10)}`,
              source: "automatic" as const,
              title: turma.curso.nome,
              description: `Turma ${turma.nome}`,
              type: "AULA",
              start: startDate,
              end: endDate,
              allDay: false,
              color: null,
              location: null,
              professor: {
                id: turma.professor.id,
                nome: turma.professor.nome,
              },
              turma: {
                id: turma.id,
                nome: turma.nome,
              },
              curso: {
                id: turma.curso.id,
                nome: turma.curso.nome,
                categoria: turma.curso.categoria,
              },
            }
          })
      )
    )

    const events = [...manual, ...automatic].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    )

    return NextResponse.json({
      data: events,
      meta: {
        start,
        end,
        total: events.length,
        manualCount: manual.length,
        automaticCount: automatic.length,
      },
    })
  } catch (error) {
    console.error("Erro ao buscar calendário:", error)

    return NextResponse.json(
      { error: "Erro ao buscar calendário" },
      { status: 500 }
    )
  }
}