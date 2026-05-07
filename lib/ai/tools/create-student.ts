import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAlunoSchema } from "@/lib/validations/aluno";

function str(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

export async function createStudentTool(
  args: Record<string, unknown>,
  schoolId?: string | null
) {
  const sid = schoolId?.trim();
  if (!sid) {
    return {
      ok: false,
      error: "missing_school",
      message: "Escola não identificada na sessão.",
    };
  }

  const confirmed = Boolean(args.confirmed);

  const payload = {
    nome: str(args.nome) ?? "",
    email: str(args.email),
    cpf: args.cpf === undefined || args.cpf === null ? undefined : String(args.cpf),
    telefone: str(args.telefone),
    dataNascimento: args.dataNascimento,
    endereco: str(args.endereco),
    responsavelNome: str(args.responsavelNome),
    responsavelTelefone: args.responsavelTelefone,
    responsavelEmail: str(args.responsavelEmail),
    responsavelCpf: args.responsavelCpf,
    observacoesGerais: str(args.observacoesGerais),
    status: args.status,
  };

  const parsed = createAlunoSchema.safeParse(payload);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      ok: false,
      error: "validation",
      fieldErrors: flat.fieldErrors,
      message:
        "Dados do aluno inválidos. Corrija os campos indicados antes de confirmar.",
    };
  }

  const preview = {
    nome: parsed.data.nome,
    email: parsed.data.email ?? null,
    telefone: parsed.data.telefone ?? null,
    cpf: parsed.data.cpf ?? null,
    status: parsed.data.status,
  };

  if (!confirmed) {
    return {
      ok: false,
      needsConfirmation: true,
      preview,
      instrucao:
        "Mostre o resumo ao usuário e explique que será criado um cadastro de aluno. Só chame com confirmed:true depois da aceitação explícita.",
      suggestedPhrase: `confirmar cadastro do aluno ${parsed.data.nome}`,
    };
  }

  try {
    const aluno = await prisma.aluno.create({
      data: {
        schoolId: sid,
        nome: parsed.data.nome,
        email: parsed.data.email || null,
        cpf: parsed.data.cpf?.replace(/\D/g, "") || null,
        telefone: parsed.data.telefone?.replace(/\D/g, "") || null,
        dataNascimento: parsed.data.dataNascimento,
        endereco: parsed.data.endereco || null,
        status: parsed.data.status,
        responsavelNome: parsed.data.responsavelNome || null,
        responsavelTelefone:
          parsed.data.responsavelTelefone?.replace(/\D/g, "") || null,
        responsavelEmail: parsed.data.responsavelEmail || null,
        responsavelCpf: parsed.data.responsavelCpf?.replace(/\D/g, "") || null,
        possuiLaudo: parsed.data.possuiLaudo ?? false,
        laudoDescricao: parsed.data.laudoDescricao || null,
        laudoCid: parsed.data.laudoCid || null,
        laudoTipo: parsed.data.laudoTipo || null,
        laudoNivel: parsed.data.laudoNivel || null,
        laudoProfissional: parsed.data.laudoProfissional || null,
        laudoData: parsed.data.laudoData ? new Date(parsed.data.laudoData) : null,
        alergias: parsed.data.alergias || null,
        medicamentos: parsed.data.medicamentos || null,
        condicoesCronicas: parsed.data.condicoesCronicas || null,
        planoSaude: parsed.data.planoSaude || null,
        contatoEmergenciaNome: parsed.data.contatoEmergenciaNome || null,
        contatoEmergenciaTelefone:
          parsed.data.contatoEmergenciaTelefone || null,
        adaptacaoNecessaria: parsed.data.adaptacaoNecessaria ?? false,
        adaptacaoDescricao: parsed.data.adaptacaoDescricao || null,
        observacoesMedicas: parsed.data.observacoesMedicas || null,
        observacoesProf: parsed.data.observacoesProf || null,
        tratamentos: parsed.data.tratamentos || null,
        observacoesGerais: parsed.data.observacoesGerais || null,
        indicacao: parsed.data.indicacao || null,
        nivelInicial: parsed.data.nivelInicial || null,
        idiomaNativo: parsed.data.idiomaNativo || null,
      },
    });

    await prisma.notificacao.create({
      data: {
        schoolId: sid,
        tipo: "NOVO_ALUNO",
        titulo: "Novo aluno cadastrado",
        mensagem: `${aluno.nome} foi cadastrado no sistema (via EduIA).`,
        entidadeTipo: "ALUNO",
        entidadeId: aluno.id,
      },
    });

    return {
      ok: true,
      alunoId: aluno.id,
      nome: aluno.nome,
      message: "Aluno cadastrado com sucesso.",
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        error: "duplicate",
        message: "Já existe um aluno com esse e-mail ou CPF nesta escola.",
      };
    }
    console.error("createStudentTool:", error);
    return {
      ok: false,
      error: "create_failed",
      message: "Não foi possível cadastrar o aluno.",
    };
  }
}
