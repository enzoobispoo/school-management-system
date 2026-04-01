import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const apiKey =
      user.openaiApiKey?.trim() || process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { error: "EduIA não está configurada no momento." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const message = String(body?.message ?? "").trim();

    if (!message) {
      return NextResponse.json(
        { error: "Mensagem obrigatória." },
        { status: 400 }
      );
    }

    const client = new OpenAI({
      apiKey,
    });

    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(
      hoje.getFullYear(),
      hoje.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const [
      totalAlunos,
      matriculasAtivas,
      pagamentosPendentes,
      pagamentosAtrasados,
      receitaRecebidaNoMes,
      cursosTop,
      proximosEventos,
    ] = await Promise.all([
      prisma.aluno.count(),
      prisma.matricula.count({ where: { status: "ATIVA" } }),
      prisma.pagamento.findMany({
        where: { status: "PENDENTE" },
        include: {
          matricula: {
            include: {
              aluno: true,
              turma: { include: { curso: true } },
            },
          },
        },
        orderBy: { vencimento: "asc" },
        take: 8,
      }),
      prisma.pagamento.findMany({
        where: { status: "ATRASADO" },
        include: {
          matricula: {
            include: {
              aluno: true,
              turma: { include: { curso: true } },
            },
          },
        },
        orderBy: { vencimento: "asc" },
        take: 8,
      }),
      prisma.pagamento.aggregate({
        _sum: { valor: true },
        where: {
          status: "PAGO",
          dataPagamento: {
            gte: inicioMes,
            lte: fimMes,
          },
        },
      }),
      prisma.curso.findMany({
        include: {
          turmas: {
            include: {
              matriculas: {
                where: { status: "ATIVA" },
                select: { id: true },
              },
            },
          },
        },
      }),
      prisma.evento.findMany({
        where: {
          dataInicio: { gte: hoje },
          ativo: true,
        },
        include: {
          professor: true,
          turma: true,
          curso: true,
        },
        orderBy: { dataInicio: "asc" },
        take: 6,
      }),
    ]);

    const cursosRankeados = cursosTop
      .map((curso) => ({
        nome: curso.nome,
        alunos: curso.turmas.reduce(
          (acc, turma) => acc + turma.matriculas.length,
          0
        ),
      }))
      .sort((a, b) => b.alunos - a.alunos)
      .slice(0, 5);

    const contexto = {
      resumo: {
        totalAlunos,
        matriculasAtivas,
        receitaMensalRecebida: formatCurrency(
          Number(receitaRecebidaNoMes._sum.valor ?? 0)
        ),
        quantidadePagamentosPendentes: pagamentosPendentes.length,
        quantidadePagamentosAtrasados: pagamentosAtrasados.length,
      },
      pagamentosPendentes: pagamentosPendentes.map((p) => ({
        aluno: p.matricula.aluno.nome,
        curso: p.matricula.turma.curso.nome,
        valor: formatCurrency(Number(p.valor)),
        vencimento: p.vencimento.toISOString(),
      })),
      pagamentosAtrasados: pagamentosAtrasados.map((p) => ({
        aluno: p.matricula.aluno.nome,
        curso: p.matricula.turma.curso.nome,
        valor: formatCurrency(Number(p.valor)),
        vencimento: p.vencimento.toISOString(),
      })),
      cursosMaisPopulares: cursosRankeados,
      proximosEventos: proximosEventos.map((e) => ({
        titulo: e.titulo,
        tipo: e.tipo,
        inicio: e.dataInicio.toISOString(),
        professor: e.professor?.nome ?? null,
        turma: e.turma?.nome ?? null,
        curso: e.curso?.nome ?? null,
      })),
    };

    const systemPrompt = `
Você é um assistente de IA de um sistema de gestão escolar.
Responda em português do Brasil.
Seja objetivo, útil e natural.
Use APENAS os dados fornecidos no contexto.
Se a resposta não estiver no contexto, diga isso claramente.
Quando fizer sentido, responda em tópicos curtos.
Não invente números, nomes ou datas.
`;

    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Contexto do sistema:\n${JSON.stringify(
            contexto,
            null,
            2
          )}\n\nPergunta do usuário:\n${message}`,
        },
      ],
      store: false,
    });

    return NextResponse.json({
      message:
        response.output_text?.trim() ||
        "Não foi possível gerar uma resposta no momento.",
    });
  } catch (error) {
    console.error("Erro na IA do dashboard:", error);

    let friendlyMessage =
      "EduIA está temporariamente indisponível. Tente novamente em alguns instantes.";

    if (error instanceof Error) {
      if (error.message.includes("429")) {
        friendlyMessage =
          "EduIA não está disponivel no momento. Entre em contato com Enzo para mais informações.";
      } else if (
        error.message.toLowerCase().includes("api key") ||
        error.message.toLowerCase().includes("incorrect api key")
      ) {
        friendlyMessage =
          "EduIA não está disponivel no momento. Entre em contato com Enzo para mais informações.";
      }
    }

    return NextResponse.json(
      { error: friendlyMessage },
      { status: 500 }
    );
  }
}