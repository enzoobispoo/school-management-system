import { z } from "zod"
import { StatusAluno } from "@prisma/client"
import { cpf as cpfValidator } from "cpf-cnpj-validator"

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (value === "" || value === null) return undefined
    return value
  }, schema.optional())

export const createAlunoSchema = z.object({
  nome: z
    .string({ required_error: "Nome é obrigatório" })
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(120, "Nome deve ter no máximo 120 caracteres"),

  email: emptyToUndefined(
    z.string().email("E-mail inválido").max(120, "E-mail muito longo")
  ),

  cpf: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const digits = String(v).replace(/\D/g, "");
    return digits.length === 0 ? undefined : digits;
  }, z.string().refine((v) => cpfValidator.isValid(v), "CPF inválido").optional()),

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

  responsavelNome: emptyToUndefined(
    z
      .string()
      .min(3, "Nome do responsável deve ter pelo menos 3 caracteres")
      .max(120, "Nome do responsável deve ter no máximo 120 caracteres")
  ),

  responsavelTelefone: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const digits = String(v).replace(/\D/g, "");
    return digits.length === 0 ? undefined : digits;
  }, z.string().refine((v) => v.length >= 10 && v.length <= 11, "Telefone do responsável deve ter 10 ou 11 dígitos").optional()),

  responsavelEmail: emptyToUndefined(
    z.string().email("E-mail do responsável inválido").max(120)
  ),

  responsavelCpf: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const digits = String(v).replace(/\D/g, "");
    return digits.length === 0 ? undefined : digits;
  }, z.string().refine((v) => cpfValidator.isValid(v), "CPF do responsável inválido").optional()),

  possuiLaudo: z.boolean().optional().default(false),
  laudoDescricao: emptyToUndefined(z.string().max(500)),
  laudoCid: emptyToUndefined(z.string().max(20)),
  laudoTipo: emptyToUndefined(z.string().max(100)),
  laudoNivel: emptyToUndefined(z.string().max(50)),
  laudoProfissional: emptyToUndefined(z.string().max(120)),
  laudoData: emptyToUndefined(z.string().max(30)),
  alergias: emptyToUndefined(z.string().max(500)),
  medicamentos: emptyToUndefined(z.string().max(500)),
  condicoesCronicas: emptyToUndefined(z.string().max(500)),
  planoSaude: emptyToUndefined(z.string().max(120)),
  contatoEmergenciaNome: emptyToUndefined(z.string().max(120)),
  contatoEmergenciaTelefone: emptyToUndefined(z.string().max(20)),
  adaptacaoNecessaria: z.boolean().optional().default(false),
  adaptacaoDescricao: emptyToUndefined(z.string().max(500)),
  observacoesMedicas: emptyToUndefined(z.string().max(500)),
  observacoesProf: emptyToUndefined(z.string().max(500)),
  tratamentos: emptyToUndefined(z.string().max(500)),

  status: z.nativeEnum(StatusAluno).optional().default(StatusAluno.ATIVO),

  observacoesGerais: emptyToUndefined(z.string().max(1000)),
  indicacao: emptyToUndefined(z.string().max(255)),
  nivelInicial: emptyToUndefined(z.string().max(100)),
  idiomaNativo: emptyToUndefined(z.string().max(100)),
  motivoSaida: emptyToUndefined(z.string().max(500)),
  dataSaida: emptyToUndefined(z.string().max(30)),
})

export const updateAlunoSchema = createAlunoSchema.partial()

export type CreateAlunoInput = z.infer<typeof createAlunoSchema>
export type UpdateAlunoInput = z.infer<typeof updateAlunoSchema>