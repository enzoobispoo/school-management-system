import { StatusMatricula } from "@prisma/client"
import { z } from "zod"

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (value === "" || value === null) return undefined
    return value
  }, schema.optional())

export const createMatriculaSchema = z.object({
  alunoId: z.string({ required_error: "Aluno é obrigatório" }).cuid("Aluno inválido"),
  turmaId: z.string({ required_error: "Turma é obrigatória" }).cuid("Turma inválida"),
  diaVencimentoMensal: emptyToUndefined(
    z.coerce
      .number({ invalid_type_error: "Dia de vencimento inválido" })
      .int()
      .min(1, "Use um dia entre 1 e 31")
      .max(31, "Use um dia entre 1 e 31")
  ),
  dataMatricula: emptyToUndefined(
    z.coerce.date({
      invalid_type_error: "Data de matrícula inválida",
    })
  ),
  observacoes: emptyToUndefined(
    z.string().max(500, "Observações devem ter no máximo 500 caracteres")
  ),
  status: z.nativeEnum(StatusMatricula).optional().default(StatusMatricula.ATIVA),
})

export const updateMatriculaSchema = z.object({
  turmaId: emptyToUndefined(z.string().cuid("Turma inválida")),
  diaVencimentoMensal: z
    .union([
      z.coerce
        .number({ invalid_type_error: "Dia de vencimento inválido" })
        .int()
        .min(1)
        .max(31),
      z.null(),
    ])
    .optional(),
  dataMatricula: emptyToUndefined(
    z.coerce.date({
      invalid_type_error: "Data de matrícula inválida",
    })
  ),
  dataCancelamento: emptyToUndefined(
    z.coerce.date({
      invalid_type_error: "Data de cancelamento inválida",
    })
  ),
  motivoCancelamento: emptyToUndefined(
    z.string().max(500, "Motivo de cancelamento deve ter no máximo 500 caracteres")
  ),
  observacoes: emptyToUndefined(
    z.string().max(500, "Observações devem ter no máximo 500 caracteres")
  ),
  status: z.nativeEnum(StatusMatricula).optional(),
})

export type CreateMatriculaInput = z.infer<typeof createMatriculaSchema>
export type UpdateMatriculaInput = z.infer<typeof updateMatriculaSchema>