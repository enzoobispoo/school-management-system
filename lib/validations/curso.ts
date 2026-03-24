import { z } from "zod"

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (value === "" || value === null) return undefined
    return value
  }, schema.optional())

export const createCursoSchema = z.object({
  nome: z
    .string({ required_error: "Nome é obrigatório" })
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(120, "Nome deve ter no máximo 120 caracteres"),

  categoria: z
    .string({ required_error: "Categoria é obrigatória" })
    .min(2, "Categoria inválida")
    .max(60, "Categoria deve ter no máximo 60 caracteres"),

  descricao: emptyToUndefined(
    z.string().max(500, "Descrição deve ter no máximo 500 caracteres")
  ),

  duracaoTexto: emptyToUndefined(
    z.string().max(50, "Duração deve ter no máximo 50 caracteres")
  ),

  valorMensal: z.coerce
    .number({
      required_error: "Valor mensal é obrigatório",
      invalid_type_error: "Valor mensal inválido",
    })
    .positive("Valor mensal deve ser maior que zero"),

  ativo: z.coerce.boolean().optional().default(true),
})

export const updateCursoSchema = createCursoSchema.partial()

export type CreateCursoInput = z.infer<typeof createCursoSchema>
export type UpdateCursoInput = z.infer<typeof updateCursoSchema>