import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertCoreFinanceWrite,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";
import { logSchoolAudit } from "@/lib/audit/school-audit-log";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function normalizeStoredPaymentMethod(method?: string | null) {
  const normalized = method?.trim();
  return normalized || "PIX";
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const deniedWrite = assertCoreFinanceWrite(user);
    if (deniedWrite) return deniedWrite;

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const [pagamento, settings] = await Promise.all([
      prisma.pagamento.findFirst({
        where: { id, schoolId },
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
        where: { schoolId },
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
        schoolId: pagamento.schoolId,
        tipo: "PAGAMENTO",
        titulo: "Pagamento recebido",
        mensagem: `${pagamento.matricula.aluno.nome} pagou ${pagamento.matricula.turma.curso.nome}.`,
        entidadeTipo: "PAGAMENTO",
        entidadeId: pagamento.id,
      },
    });

    void logSchoolAudit({
      schoolId,
      userId: user.id,
      role: user.role,
      domain: "finance",
      action: "PAYMENT_MARK_PAID",
      resourceId: pagamento.id,
      summary: `Baixa manual: ${pagamento.descricao} — ${pagamento.matricula.aluno.nome}`,
      payload: {
        valor: Number(pagamento.valor),
        metodoPagamento,
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