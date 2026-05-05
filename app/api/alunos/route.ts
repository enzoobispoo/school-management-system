import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAlunoSchema } from "@/lib/validations/aluno";
import { Prisma, StatusMatricula } from "@prisma/client";
import { getCurrentUser, requireSchool } from "@/lib/auth";

function getComputedPaymentStatus(pagamento: {
  status: string;
  vencimento: Date;
  dataPagamento: Date | null;
}) {
  if (pagamento.status === "CANCELADO") return "CANCELADO";
  if (pagamento.status === "PAGO" || pagamento.dataPagamento) return "PAGO";

  const hoje = new Date();
  const vencimento = new Date(pagamento.vencimento);

  hoje.setHours(0, 0, 0, 0);
  vencimento.setHours(0, 0, 0, 0);

  if (vencimento < hoje) return "ATRASADO";
  return "PENDENTE";
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id")?.trim() || "";
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim();
    const courseId = searchParams.get("courseId")?.trim() || "";
    const turmaId = searchParams.get("turmaId")?.trim() || "";
    const matriculaStatus = searchParams.get("matriculaStatus")?.trim() || "";
    const recent = searchParams.get("recent") === "true";
    const page = Math.max(Number(searchParams.get("page") || "1"), 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || "10"), 1),
      100
    );

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    );

    const where: Prisma.AlunoWhereInput = {
      ...(id ? { id } : {}),
      ...(recent
        ? {
            createdAt: {
              gte: startOfCurrentMonth,
              lt: endOfCurrentMonth,
            },
          }
        : {}),
      ...(courseId || turmaId || matriculaStatus
        ? {
            matriculas: {
              some: {
                ...(courseId ? { turma: { cursoId: courseId } } : {}),
                ...(turmaId ? { turmaId } : {}),
                ...(matriculaStatus ? { status: matriculaStatus as StatusMatricula } : {}),
              },
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { nome: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { telefone: { contains: search, mode: "insensitive" } },
              {
                responsavelNome: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                responsavelTelefone: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                responsavelEmail: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };

    const [total, alunos] = await Promise.all([
      prisma.aluno.count({ where }),
      prisma.aluno.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          matriculas: {
            include: {
              turma: {
                include: {
                  curso: true,
                },
              },
              pagamentos: {
                orderBy: { vencimento: "desc" },
                take: 5,
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
    ]);

    const data = alunos.map((aluno) => {
      const cursos = aluno.matriculas.map(
        (matricula) => matricula.turma.curso.nome
      );

      const pagamentos = aluno.matriculas.flatMap((matricula) =>
        matricula.pagamentos.map((pagamento) => ({
          id: pagamento.id,
          matriculaId: matricula.id,
          descricao: pagamento.descricao,
          valor: Number(pagamento.valor),
          status: getComputedPaymentStatus(pagamento),
          vencimento: pagamento.vencimento,
          dataPagamento: pagamento.dataPagamento,
          competenciaMes: pagamento.competenciaMes,
          competenciaAno: pagamento.competenciaAno,
        }))
      );

      return {
        id: aluno.id,
        nome: aluno.nome,
        cpf: aluno.cpf,
        email: aluno.email,
        telefone: aluno.telefone,
        responsavelNome: aluno.responsavelNome,
        responsavelTelefone: aluno.responsavelTelefone,
        responsavelEmail: aluno.responsavelEmail,
        responsavelCpf: aluno.responsavelCpf,
        dataNascimento: aluno.dataNascimento,
        endereco: aluno.endereco,
        status: aluno.status,
        createdAt: aluno.createdAt,
        updatedAt: aluno.updatedAt,
        possuiLaudo: aluno.possuiLaudo,
        laudoTipo: aluno.laudoTipo,
        laudoCid: aluno.laudoCid,
        laudoNivel: aluno.laudoNivel,
        laudoProfissional: aluno.laudoProfissional,
        laudoData: aluno.laudoData,
        laudoDescricao: aluno.laudoDescricao,
        adaptacaoNecessaria: aluno.adaptacaoNecessaria,
        adaptacaoDescricao: aluno.adaptacaoDescricao,
        alergias: aluno.alergias,
        medicamentos: aluno.medicamentos,
        condicoesCronicas: aluno.condicoesCronicas,
        planoSaude: aluno.planoSaude,
        contatoEmergenciaNome: aluno.contatoEmergenciaNome,
        contatoEmergenciaTelefone: aluno.contatoEmergenciaTelefone,
        observacoesMedicas: aluno.observacoesMedicas,
        observacoesProf: aluno.observacoesProf,
        tratamentos: aluno.tratamentos,
        fotoUrl: aluno.fotoUrl,
        observacoesGerais: aluno.observacoesGerais,
        indicacao: aluno.indicacao,
        nivelInicial: aluno.nivelInicial,
        idiomaNativo: aluno.idiomaNativo,
        motivoSaida: aluno.motivoSaida,
        dataSaida: aluno.dataSaida,
        cursos,
        matriculas: aluno.matriculas.map((matricula) => ({
          id: matricula.id,
          status: matricula.status,
          dataMatricula: matricula.dataMatricula,
          turma: {
            id: matricula.turma.id,
            nome: matricula.turma.nome,
            curso: {
              id: matricula.turma.curso.id,
              nome: matricula.turma.curso.nome,
              categoria: matricula.turma.curso.categoria,
            },
          },
        })),
        pagamentos,
      };
    });

    const filteredData = status
      ? data.filter((aluno) => {
          const paymentStatuses = aluno.pagamentos.map(
            (pagamento) => pagamento.status
          );

          let financialStatus = "paid";
          if (paymentStatuses.includes("ATRASADO")) {
            financialStatus = "overdue";
          } else if (paymentStatuses.includes("PENDENTE")) {
            financialStatus = "pending";
          }

          return financialStatus === status;
        })
      : data;

    return NextResponse.json({
      data: filteredData,
      meta: {
        total: status ? filteredData.length : total,
        page,
        pageSize,
        totalPages: Math.ceil((status ? filteredData.length : total) / pageSize),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar alunos:", error);

    return NextResponse.json(
      { error: "Erro ao buscar alunos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const body = await request.json();
    const parsed = createAlunoSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstField = Object.keys(fieldErrors)[0];
      const firstMessage = firstField
        ? (fieldErrors as Record<string, string[]>)[firstField]?.[0]
        : undefined;

      return NextResponse.json(
        {
          error: firstMessage || "Dados inválidos",
          field: firstField,
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    const aluno = await prisma.aluno.create({
      data: {
        schoolId,
        nome: parsed.data.nome,
        email: parsed.data.email || null,
        cpf: parsed.data.cpf?.replace(/\D/g, "") || null,
        telefone: parsed.data.telefone?.replace(/\D/g, "") || null,
        dataNascimento: parsed.data.dataNascimento,
        endereco: parsed.data.endereco || null,
        status: parsed.data.status,
        responsavelNome: parsed.data.responsavelNome || null,
        responsavelTelefone: parsed.data.responsavelTelefone?.replace(/\D/g, "") || null,
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
        contatoEmergenciaTelefone: parsed.data.contatoEmergenciaTelefone || null,
        adaptacaoNecessaria: parsed.data.adaptacaoNecessaria ?? false,
        adaptacaoDescricao: parsed.data.adaptacaoDescricao || null,
        observacoesMedicas: parsed.data.observacoesMedicas || null,
        observacoesProf: parsed.data.observacoesProf || null,
        tratamentos: parsed.data.tratamentos || null,
      },
    });

    await prisma.notificacao.create({
      data: {
        schoolId,
        tipo: "NOVO_ALUNO",
        titulo: "Novo aluno cadastrado",
        mensagem: `${aluno.nome} foi cadastrado no sistema.`,
        entidadeTipo: "ALUNO",
        entidadeId: aluno.id,
      },
    });

    return NextResponse.json(aluno, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar aluno:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Já existe um aluno com esse e-mail ou CPF" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao criar aluno" },
      { status: 500 }
    );
  }
}