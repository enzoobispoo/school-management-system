import { z } from "zod"
import { StatusAluno } from "@prisma/client"

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (value === "" || value === null) return undefined
    return value
  }, schema.optional())

const onlyDigits = (value: string) => value.replace(/\D/g, "")

export const createAlunoSchema = z.object({
  nome: z
    .string({ required_error: "Nome é obrigatório" })
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(120, "Nome deve ter no máximo 120 caracteres"),

  email: emptyToUndefined(
    z.string().email("E-mail inválido").max(120, "E-mail muito longo")
  ),

  cpf: emptyToUndefined(
    z
      .string()
      .transform((value) => onlyDigits(value))
      .refine((value) => value.length === 11, "CPF deve ter 11 dígitos")
  ),

  telefone: emptyToUndefined(
    z.string().max(20, "Telefone deve ter no máximo 20 caracteres")
  ),

  dataNascimento: emptyToUndefined(
    z.coerce.date({
      invalid_type_error: "Data de nascimento inválida",
    })
  ),

  endereco: emptyToUndefined(
    z.string().max(255, "Endereço deve ter no máximo 255 caracteres")
  ),

  status: z.nativeEnum(StatusAluno).optional().default(StatusAluno.ATIVO),
})

export const updateAlunoSchema = createAlunoSchema.partial()

export type CreateAlunoInput = z.infer<typeof createAlunoSchema>
export type UpdateAlunoInput = z.infer<typeof updateAlunoSchema>