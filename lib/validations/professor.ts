import { z } from "zod"

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (value === "" || value === null) return undefined
    return value
  }, schema.optional())

export const createProfessorSchema = z.object({
  nome: z
    .string({ required_error: "Nome é obrigatório" })
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(120, "Nome deve ter no máximo 120 caracteres"),

  email: emptyToUndefined(
    z.string().email("E-mail inválido").max(120, "E-mail muito longo")
  ),

  telefone: emptyToUndefined(
    z.string().max(20, "Telefone deve ter no máximo 20 caracteres")
  ),

  ativo: z.coerce.boolean().optional().default(true),
})

export const updateProfessorSchema = z.object({
  nome: z.string().min(3).max(120).optional(),
  email: emptyToUndefined(
    z.string().email("E-mail inválido").max(120, "E-mail muito longo")
  ),
  telefone: emptyToUndefined(
    z.string().max(20, "Telefone deve ter no máximo 20 caracteres")
  ),
  ativo: z.coerce.boolean().optional(),
})

export type CreateProfessorInput = z.infer<typeof createProfessorSchema>
export type UpdateProfessorInput = z.infer<typeof updateProfessorSchema>