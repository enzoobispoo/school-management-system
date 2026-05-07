import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createProfessorSchema } from "@/lib/validations/professor";

export async function createProfessorTool(
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

  const parsed = createProfessorSchema.safeParse({
    nome: args.nome,
    email: args.email,
    telefone: args.telefone,
    ativo: args.ativo,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "validation",
      details: parsed.error.flatten(),
      message: "Dados do professor inválidos.",
    };
  }

  const preview = {
    nome: parsed.data.nome,
    email: parsed.data.email ?? null,
    telefone: parsed.data.telefone ?? null,
    ativo: parsed.data.ativo,
  };

  if (!confirmed) {
    return {
      ok: false,
      needsConfirmation: true,
      preview,
      instrucao:
        "Mostre o resumo e peça confirmação. Depois chame com confirmed:true.",
      suggestedPhrase: `confirmar cadastro do professor ${parsed.data.nome}`,
    };
  }

  try {
    const professor = await prisma.professor.create({
      data: {
        schoolId: sid,
        nome: parsed.data.nome,
        email: parsed.data.email,
        telefone: parsed.data.telefone,
        ativo: parsed.data.ativo,
      },
    });

    await prisma.notificacao.create({
      data: {
        schoolId: sid,
        tipo: "SISTEMA",
        titulo: "Novo professor cadastrado",
        mensagem: `${professor.nome} foi cadastrado no sistema (via EduIA).`,
        entidadeTipo: "PROFESSOR",
        entidadeId: professor.id,
      },
    });

    return {
      ok: true,
      professorId: professor.id,
      nome: professor.nome,
      message: "Professor cadastrado com sucesso.",
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        error: "duplicate",
        message: "Já existe um professor com esse e-mail nesta escola.",
      };
    }
    console.error("createProfessorTool:", error);
    return {
      ok: false,
      error: "create_failed",
      message: "Não foi possível cadastrar o professor.",
    };
  }
}
