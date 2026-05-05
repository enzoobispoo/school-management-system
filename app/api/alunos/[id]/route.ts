import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateAlunoSchema } from "@/lib/validations/aluno"
import { Prisma } from "@prisma/client"
import { getCurrentUser, requireSchool } from "@/lib/auth"

function getComputedPaymentStatus(pagamento: {
  status: string
  vencimento: Date
  dataPagamento: Date | null
}) {
  if (pagamento.status === "CANCELADO") return "CANCELADO"
  if (pagamento.status === "PAGO" || pagamento.dataPagamento) return "PAGO"

  const hoje = new Date()
  const vencimento = new Date(pagamento.vencimento)

  hoje.setHours(0, 0, 0, 0)
  vencimento.setHours(0, 0, 0, 0)

  if (vencimento < hoje) return "ATRASADO"
  return "PENDENTE"
}

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;
    const { id } = await context.params
    const aluno = await prisma.aluno.findFirst({
      where: { id, schoolId },
      include: {
        matriculas: {
          include: {
            turma: {
              include: {
                curso: true,
                professor: true,
                horarios: true,
              },
            },
            pagamentos: {
              orderBy: { vencimento: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      )
    }

    const response = {
      id: aluno.id,
      cpf: aluno.cpf,
      nome: aluno.nome,
      email: aluno.email,
      telefone: aluno.telefone,
      responsavelNome: aluno.responsavelNome,
      responsavelTelefone: aluno.responsavelTelefone,
      responsavelEmail: aluno.responsavelEmail,
      dataNascimento: aluno.dataNascimento,
      endereco: aluno.endereco,
      status: aluno.status,
      createdAt: aluno.createdAt,
      updatedAt: aluno.updatedAt,
      matriculas: aluno.matriculas.map((matricula) => ({
        id: matricula.id,
        status: matricula.status,
        dataMatricula: matricula.dataMatricula,
        dataCancelamento: matricula.dataCancelamento,
        motivoCancelamento: matricula.motivoCancelamento,
        observacoes: matricula.observacoes,
        turma: {
          id: matricula.turma.id,
          nome: matricula.turma.nome,
          capacidadeMaxima: matricula.turma.capacidadeMaxima,
          ativo: matricula.turma.ativo,
          curso: {
            id: matricula.turma.curso.id,
            nome: matricula.turma.curso.nome,
            categoria: matricula.turma.curso.categoria,
            valorMensal: Number(matricula.turma.curso.valorMensal),
            duracaoTexto: matricula.turma.curso.duracaoTexto,
          },
          professor: {
            id: matricula.turma.professor.id,
            nome: matricula.turma.professor.nome,
            email: matricula.turma.professor.email,
            telefone: matricula.turma.professor.telefone,
          },
          horarios: matricula.turma.horarios,
        },
        pagamentos: matricula.pagamentos.map((pagamento) => ({
          id: pagamento.id,
          descricao: pagamento.descricao,
          valor: Number(pagamento.valor),
          status: getComputedPaymentStatus(pagamento),
          vencimento: pagamento.vencimento,
          dataPagamento: pagamento.dataPagamento,
          competenciaMes: pagamento.competenciaMes,
          competenciaAno: pagamento.competenciaAno,
          metodoPagamento: pagamento.metodoPagamento,
          observacoes: pagamento.observacoes,
        })),
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Erro ao buscar aluno:", error)

    return NextResponse.json(
      { error: "Erro ao buscar aluno" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;
    const { id } = await context.params
    const body = await request.json()

    const parsed = updateAlunoSchema.safeParse(body)

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
      )
    }

    const alunoExistente = await prisma.aluno.findFirst({
      where: { id, schoolId },
      select: { id: true, nome: true, status: true },
    })

    if (!alunoExistente) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      )
    }

    const statusAnterior = alunoExistente.status;

    const aluno = await prisma.aluno.update({
      where: { id },
      data: {
        ...(parsed.data.nome !== undefined ? { nome: parsed.data.nome } : {}),
        ...(parsed.data.email !== undefined ? { email: parsed.data.email } : {}),
        ...(parsed.data.cpf !== undefined
          ? { cpf: parsed.data.cpf?.replace(/\D/g, "") || null }
          : {}),
        ...(parsed.data.telefone !== undefined
          ? { telefone: parsed.data.telefone?.replace(/\D/g, "") || null }
          : {}),
        ...(parsed.data.dataNascimento !== undefined
          ? { dataNascimento: parsed.data.dataNascimento }
          : {}),
        ...(parsed.data.endereco !== undefined
          ? { endereco: parsed.data.endereco || null }
          : {}),
        ...(parsed.data.status !== undefined
          ? { status: parsed.data.status }
          : {}),
        ...(parsed.data.responsavelNome !== undefined
          ? { responsavelNome: parsed.data.responsavelNome || null }
          : {}),
        ...(parsed.data.responsavelTelefone !== undefined
          ? {
              responsavelTelefone:
                parsed.data.responsavelTelefone?.replace(/\D/g, "") || null,
            }
          : {}),
        ...(parsed.data.responsavelEmail !== undefined ? { responsavelEmail: parsed.data.responsavelEmail || null } : {}),
        ...(parsed.data.responsavelCpf !== undefined ? { responsavelCpf: parsed.data.responsavelCpf?.replace(/\D/g, "") || null } : {}),
        ...(parsed.data.possuiLaudo !== undefined ? { possuiLaudo: parsed.data.possuiLaudo } : {}),
        ...(parsed.data.laudoDescricao !== undefined ? { laudoDescricao: parsed.data.laudoDescricao || null } : {}),
        ...(parsed.data.laudoCid !== undefined ? { laudoCid: parsed.data.laudoCid || null } : {}),
        ...(parsed.data.laudoTipo !== undefined ? { laudoTipo: parsed.data.laudoTipo || null } : {}),
        ...(parsed.data.laudoNivel !== undefined ? { laudoNivel: parsed.data.laudoNivel || null } : {}),
        ...(parsed.data.laudoProfissional !== undefined ? { laudoProfissional: parsed.data.laudoProfissional || null } : {}),
        ...(parsed.data.laudoData !== undefined ? { laudoData: parsed.data.laudoData ? new Date(parsed.data.laudoData) : null } : {}),
        ...(parsed.data.alergias !== undefined ? { alergias: parsed.data.alergias || null } : {}),
        ...(parsed.data.medicamentos !== undefined ? { medicamentos: parsed.data.medicamentos || null } : {}),
        ...(parsed.data.condicoesCronicas !== undefined ? { condicoesCronicas: parsed.data.condicoesCronicas || null } : {}),
        ...(parsed.data.planoSaude !== undefined ? { planoSaude: parsed.data.planoSaude || null } : {}),
        ...(parsed.data.contatoEmergenciaNome !== undefined ? { contatoEmergenciaNome: parsed.data.contatoEmergenciaNome || null } : {}),
        ...(parsed.data.contatoEmergenciaTelefone !== undefined ? { contatoEmergenciaTelefone: parsed.data.contatoEmergenciaTelefone || null } : {}),
        ...(parsed.data.adaptacaoNecessaria !== undefined ? { adaptacaoNecessaria: parsed.data.adaptacaoNecessaria } : {}),
        ...(parsed.data.adaptacaoDescricao !== undefined ? { adaptacaoDescricao: parsed.data.adaptacaoDescricao || null } : {}),
        ...(parsed.data.observacoesMedicas !== undefined ? { observacoesMedicas: parsed.data.observacoesMedicas || null } : {}),
        ...(parsed.data.observacoesProf !== undefined ? { observacoesProf: parsed.data.observacoesProf || null } : {}),
        ...(parsed.data.tratamentos !== undefined ? { tratamentos: parsed.data.tratamentos || null } : {}),
        ...((parsed.data.observacoesGerais !== undefined) ? { observacoesGerais: parsed.data.observacoesGerais || null } : {}),
        ...((parsed.data.indicacao !== undefined) ? { indicacao: parsed.data.indicacao || null } : {}),
        ...((parsed.data.nivelInicial !== undefined) ? { nivelInicial: parsed.data.nivelInicial || null } : {}),
        ...((parsed.data.idiomaNativo !== undefined) ? { idiomaNativo: parsed.data.idiomaNativo || null } : {}),
        ...((parsed.data.motivoSaida !== undefined) ? { motivoSaida: parsed.data.motivoSaida || null } : {}),
        ...((parsed.data.dataSaida !== undefined) ? { dataSaida: parsed.data.dataSaida ? new Date(parsed.data.dataSaida) : null } : {}),
      },
    })

    if (parsed.data.status && parsed.data.status !== statusAnterior) {
      await prisma.alunoStatusHistorico.create({
        data: {
          alunoId: id,
          statusDe: statusAnterior,
          statusPara: parsed.data.status,
          motivo: parsed.data.motivoSaida || null,
        },
      })
    }

    return NextResponse.json(aluno)
  } catch (error) {
    console.error("Erro ao atualizar aluno:", error)

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Já existe um aluno com esse e-mail ou CPF" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Erro ao atualizar aluno" },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;
    const { id } = await context.params
    const aluno = await prisma.aluno.findFirst({
      where: { id, schoolId },
      include: {
        matriculas: {
          where: {
            status: {
              in: ["ATIVA", "TRANCADA"],
            },
          },
        },
      },
    })

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      )
    }

    if (aluno.matriculas.length > 0) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir um aluno com matrículas ativas ou trancadas",
        },
        { status: 400 }
      )
    }

    await prisma.aluno.delete({
      where: { id },
    })

    return NextResponse.json({
      message: "Aluno excluído com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir aluno:", error)

    return NextResponse.json(
      { error: "Erro ao excluir aluno" },
      { status: 500 }
    )
  }
}