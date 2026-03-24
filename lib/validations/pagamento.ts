
import { StatusPagamento } from "@prisma/client"
import { z } from "zod"

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (value === "" || value === null) return undefined
    return value
  }, schema.optional())

export const createPagamentoSchema = z.object({
  matriculaId: z
    .string({ required_error: "Matrícula é obrigatória" })
    .cuid("Matrícula inválida"),

  competenciaMes: z.coerce
    .number({
      required_error: "Mês de competência é obrigatório",
      invalid_type_error: "Mês de competência inválido",
    })
    .int("Mês de competência inválido")
    .min(1, "Mês deve ser entre 1 e 12")
    .max(12, "Mês deve ser entre 1 e 12"),

  competenciaAno: z.coerce
    .number({
      required_error: "Ano de competência é obrigatório",
      invalid_type_error: "Ano de competência inválido",
    })
    .int("Ano de competência inválido")
    .min(2000, "Ano inválido")
    .max(2100, "Ano inválido"),

  descricao: z
    .string({ required_error: "Descrição é obrigatória" })
    .min(3, "Descrição deve ter pelo menos 3 caracteres")
    .max(255, "Descrição deve ter no máximo 255 caracteres"),

  valor: z.coerce
    .number({
      required_error: "Valor é obrigatório",
      invalid_type_error: "Valor inválido",
    })
    .positive("Valor deve ser maior que zero"),

  vencimento: z.coerce.date({
    invalid_type_error: "Data de vencimento inválida",
  }),

  dataPagamento: emptyToUndefined(
    z.coerce.date({
      invalid_type_error: "Data de pagamento inválida",
    })
  ),

  status: z.nativeEnum(StatusPagamento).optional().default(StatusPagamento.PENDENTE),

  metodoPagamento: emptyToUndefined(
    z.string().max(80, "Método de pagamento deve ter no máximo 80 caracteres")
  ),

  observacoes: emptyToUndefined(
    z.string().max(500, "Observações devem ter no máximo 500 caracteres")
  ),
})

export const updatePagamentoSchema = z.object({
  competenciaMes: z.coerce
    .number({ invalid_type_error: "Mês de competência inválido" })
    .int("Mês de competência inválido")
    .min(1)
    .max(12)
    .optional(),

  competenciaAno: z.coerce
    .number({ invalid_type_error: "Ano de competência inválido" })
    .int("Ano de competência inválido")
    .min(2000)
    .max(2100)
    .optional(),

  descricao: emptyToUndefined(
    z
      .string()
      .min(3, "Descrição deve ter pelo menos 3 caracteres")
      .max(255, "Descrição deve ter no máximo 255 caracteres")
  ),

  valor: z.coerce
    .number({ invalid_type_error: "Valor inválido" })
    .positive("Valor deve ser maior que zero")
    .optional(),

  vencimento: emptyToUndefined(
    z.coerce.date({
      invalid_type_error: "Data de vencimento inválida",
    })
  ),

  dataPagamento: emptyToUndefined(
    z.coerce.date({
      invalid_type_error: "Data de pagamento inválida",
    })
  ),

  status: z.nativeEnum(StatusPagamento).optional(),

  metodoPagamento: emptyToUndefined(
    z.string().max(80, "Método de pagamento deve ter no máximo 80 caracteres")
  ),

  observacoes: emptyToUndefined(
    z.string().max(500, "Observações devem ter no máximo 500 caracteres")
  ),
})

export type CreatePagamentoInput = z.infer<typeof createPagamentoSchema>
export type UpdatePagamentoInput = z.infer<typeof updatePagamentoSchema>