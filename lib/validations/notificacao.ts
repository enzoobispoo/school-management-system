import { EntidadeNotificacao, TipoNotificacao } from "@prisma/client"
import { z } from "zod"

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (value === "" || value === null) return undefined
    return value
  }, schema.optional())

export const createNotificacaoSchema = z.object({
  tipo: z.nativeEnum(TipoNotificacao, {
    required_error: "Tipo é obrigatório",
  }),
  titulo: z
    .string({ required_error: "Título é obrigatório" })
    .min(3, "Título deve ter pelo menos 3 caracteres")
    .max(120, "Título deve ter no máximo 120 caracteres"),
  mensagem: z
    .string({ required_error: "Mensagem é obrigatória" })
    .min(3, "Mensagem deve ter pelo menos 3 caracteres")
    .max(500, "Mensagem deve ter no máximo 500 caracteres"),
  lida: z.coerce.boolean().optional().default(false),
  entidadeTipo: z
    .nativeEnum(EntidadeNotificacao)
    .optional()
    .default(EntidadeNotificacao.SISTEMA),
  entidadeId: emptyToUndefined(z.string().cuid("Entidade inválida")),
})

export const updateNotificacaoSchema = z.object({
  lida: z.coerce.boolean().optional(),
  titulo: emptyToUndefined(
    z
      .string()
      .min(3, "Título deve ter pelo menos 3 caracteres")
      .max(120, "Título deve ter no máximo 120 caracteres")
  ),
  mensagem: emptyToUndefined(
    z
      .string()
      .min(3, "Mensagem deve ter pelo menos 3 caracteres")
      .max(500, "Mensagem deve ter no máximo 500 caracteres")
  ),
})

export const markAllAsReadSchema = z.object({
  marcarTodasComoLidas: z.literal(true),
})

export type CreateNotificacaoInput = z.infer<typeof createNotificacaoSchema>
export type UpdateNotificacaoInput = z.infer<typeof updateNotificacaoSchema>