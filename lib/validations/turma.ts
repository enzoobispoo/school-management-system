import { DiaSemana } from "@prisma/client"
import { z } from "zod"

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (value === "" || value === null) return undefined
    return value
  }, schema.optional())

const horarioSchema = z.object({
  diaSemana: z.nativeEnum(DiaSemana, {
    required_error: "Dia da semana é obrigatório",
  }),
  horaInicio: z
    .string({ required_error: "Hora de início é obrigatória" })
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora de início inválida. Use HH:mm"),
  horaFim: z
    .string({ required_error: "Hora de fim é obrigatória" })
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora de fim inválida. Use HH:mm"),
})

export const createTurmaSchema = z.object({
  cursoId: z.string({ required_error: "Curso é obrigatório" }).cuid("Curso inválido"),
  professorId: z
    .string({ required_error: "Professor é obrigatório" })
    .cuid("Professor inválido"),
  nome: z
    .string({ required_error: "Nome da turma é obrigatório" })
    .min(2, "Nome da turma deve ter pelo menos 2 caracteres")
    .max(80, "Nome da turma deve ter no máximo 80 caracteres"),
  capacidadeMaxima: z.coerce
    .number({
      required_error: "Capacidade máxima é obrigatória",
      invalid_type_error: "Capacidade máxima inválida",
    })
    .int("Capacidade máxima deve ser um número inteiro")
    .min(1, "Capacidade máxima deve ser maior que zero")
    .max(999, "Capacidade máxima muito alta"),
  ativo: z.coerce.boolean().optional().default(true),
  horarios: z
    .array(horarioSchema)
    .min(1, "A turma deve ter pelo menos um horário")
    .max(20, "Horários demais para uma única turma"),
})

export const updateTurmaSchema = z.object({
  cursoId: emptyToUndefined(z.string().cuid("Curso inválido")),
  professorId: emptyToUndefined(z.string().cuid("Professor inválido")),
  nome: emptyToUndefined(
    z
      .string()
      .min(2, "Nome da turma deve ter pelo menos 2 caracteres")
      .max(80, "Nome da turma deve ter no máximo 80 caracteres")
  ),
  capacidadeMaxima: z.coerce
    .number({
      invalid_type_error: "Capacidade máxima inválida",
    })
    .int("Capacidade máxima deve ser um número inteiro")
    .min(1, "Capacidade máxima deve ser maior que zero")
    .max(999, "Capacidade máxima muito alta")
    .optional(),
  ativo: z.coerce.boolean().optional(),
  horarios: z.array(horarioSchema).min(1).max(20).optional(),
})

export type CreateTurmaInput = z.infer<typeof createTurmaSchema>
export type UpdateTurmaInput = z.infer<typeof updateTurmaSchema>