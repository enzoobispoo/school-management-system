import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function normalizeStoredPaymentMethod(method?: string | null) {
  const normalized = method?.trim();
  return normalized || "PIX";
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const [pagamento, settings] = await Promise.all([
      prisma.pagamento.findUnique({
        where: { id },
        include: {
          matricula: {
            include: {
              aluno: true,
              turma: {
                include: {
                  curso: true,
                },
              },
            },
          },
        },
      }),
      prisma.escolaSettings.findUnique({
        where: { id: "default" },
        select: {
          metodoPagamentoPadrao: true,
        },
      }),
    ]);

    if (!pagamento) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      );
    }

    if (pagamento.status === "PAGO") {
      return NextResponse.json(
        { error: "Pagamento já foi realizado" },
        { status: 400 }
      );
    }

    const metodoPagamento =
      body.metodoPagamento?.trim() ||
      normalizeStoredPaymentMethod(settings?.metodoPagamentoPadrao);

    const pagamentoAtualizado = await prisma.pagamento.update({
      where: { id },
      data: {
        status: "PAGO",
        dataPagamento: new Date(),
        metodoPagamento,
      },
    });

    await prisma.notificacao.create({
      data: {
        tipo: "PAGAMENTO",
        titulo: "Pagamento recebido",
        mensagem: `${pagamento.matricula.aluno.nome} pagou ${pagamento.matricula.turma.curso.nome}.`,
        entidadeTipo: "PAGAMENTO",
        entidadeId: pagamento.id,
      },
    });

    return NextResponse.json(pagamentoAtualizado);
  } catch (error) {
    console.error("Erro ao registrar pagamento:", error);
    return NextResponse.json(
      { error: "Erro ao registrar pagamento" },
      { status: 500 }
    );
  }
}