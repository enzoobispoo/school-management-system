import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createCursoSchema } from "@/lib/validations/curso";

export async function createCourseTool(
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

  const parsed = createCursoSchema.safeParse({
    nome: args.nome,
    categoria: args.categoria,
    descricao: args.descricao,
    duracaoTexto: args.duracaoTexto,
    valorMensal: args.valorMensal,
    ativo: args.ativo,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "validation",
      details: parsed.error.flatten(),
      message: "Dados do curso inválidos.",
    };
  }

  const preview = {
    nome: parsed.data.nome,
    categoria: parsed.data.categoria,
    valorMensal: parsed.data.valorMensal,
    descricao: parsed.data.descricao ?? null,
    duracaoTexto: parsed.data.duracaoTexto ?? null,
    ativo: parsed.data.ativo,
  };

  if (!confirmed) {
    return {
      ok: false,
      needsConfirmation: true,
      preview,
      instrucao:
        "Explique valor mensal e categoria. Depois da confirmação explícita, chame com confirmed:true.",
      suggestedPhrase: `confirmar criação do curso ${parsed.data.nome}`,
    };
  }

  try {
    const curso = await prisma.curso.create({
      data: {
        schoolId: sid,
        nome: parsed.data.nome,
        categoria: parsed.data.categoria,
        descricao: parsed.data.descricao,
        duracaoTexto: parsed.data.duracaoTexto,
        valorMensal: parsed.data.valorMensal,
        ativo: parsed.data.ativo,
      },
    });

    await prisma.notificacao.create({
      data: {
        schoolId: sid,
        tipo: "SISTEMA",
        titulo: "Novo curso criado",
        mensagem: `O curso ${curso.nome} foi criado no sistema (via EduIA).`,
        entidadeTipo: "CURSO",
        entidadeId: curso.id,
      },
    });

    return {
      ok: true,
      cursoId: curso.id,
      nome: curso.nome,
      valorMensal: Number(curso.valorMensal),
      message: "Curso criado com sucesso.",
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        error: "duplicate",
        message: "Já existe um curso com esse nome nesta escola.",
      };
    }
    console.error("createCourseTool:", error);
    return {
      ok: false,
      error: "create_failed",
      message: "Não foi possível criar o curso.",
    };
  }
}
