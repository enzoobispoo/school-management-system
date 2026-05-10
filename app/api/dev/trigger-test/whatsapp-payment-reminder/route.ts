import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { StatusPagamento } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  assertBillingNotify,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TASK_ID = "whatsapp.payment-reminder" as const;

function triggerTestAllowed() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ENABLE_TRIGGER_WHATSAPP_TEST === "true"
  );
}

async function findEligiblePayment(schoolId: string) {
  const rows = await prisma.pagamento.findMany({
    where: {
      schoolId,
      status: { in: [StatusPagamento.PENDENTE, StatusPagamento.ATRASADO] },
    },
    include: {
      matricula: {
        include: {
          aluno: {
            select: {
              nome: true,
              telefone: true,
              responsavelTelefone: true,
            },
          },
        },
      },
    },
    orderBy: { vencimento: "asc" },
    take: 80,
  });

  for (const p of rows) {
    const phone =
      p.matricula.aluno.responsavelTelefone?.trim() ||
      p.matricula.aluno.telefone?.trim();
    if (phone) return p;
  }

  return null;
}

/**
 * Teste temporário: enfileira `whatsapp.payment-reminder` com cobrança real da escola.
 *
 * Habilitar com `NODE_ENV=development` ou `ENABLE_TRIGGER_WHATSAPP_TEST=true`.
 */
export async function POST(request: NextRequest) {
  if (!triggerTestAllowed()) {
    return NextResponse.json({ error: "NOT_ENABLED" }, { status: 404 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const schoolResult = requireSchool(user);
    if (schoolResult instanceof NextResponse) return schoolResult;
    const { schoolId } = schoolResult;

    const denied = assertBillingNotify(user);
    if (denied) return denied;

    let paymentId: string | undefined;
    try {
      const body = await request.json();
      if (body && typeof body.paymentId === "string" && body.paymentId.trim()) {
        paymentId = body.paymentId.trim();
      }
    } catch {
      /* body opcional */
    }

    if (!paymentId) {
      const found = await findEligiblePayment(schoolId);
      if (!found) {
        return NextResponse.json(
          {
            error:
              "Nenhuma cobrança PENDENTE/ATRASADA com telefone do responsável ou do aluno.",
            code: "NO_ELIGIBLE_PAYMENT",
          },
          { status: 404 }
        );
      }
      paymentId = found.id;
    } else {
      const p = await prisma.pagamento.findFirst({
        where: { id: paymentId, schoolId },
        include: {
          matricula: {
            include: {
              aluno: {
                select: {
                  telefone: true,
                  responsavelTelefone: true,
                },
              },
            },
          },
        },
      });
      if (!p) {
        return NextResponse.json(
          { error: "Pagamento não encontrado nesta escola.", code: "NOT_FOUND" },
          { status: 404 }
        );
      }
      const phone =
        p.matricula.aluno.responsavelTelefone?.trim() ||
        p.matricula.aluno.telefone?.trim();
      if (!phone) {
        return NextResponse.json(
          {
            error:
              "Esta cobrança não tem telefone do responsável nem do aluno para WhatsApp.",
            code: "NO_PHONE",
          },
          { status: 400 }
        );
      }
      if (
        p.status !== StatusPagamento.PENDENTE &&
        p.status !== StatusPagamento.ATRASADO
      ) {
        return NextResponse.json(
          {
            error:
              "Use uma cobrança PENDENTE ou ATRASADA para o teste (evita ruído em pagamentos quitados).",
            code: "INVALID_STATUS",
          },
          { status: 400 }
        );
      }
    }

    const handle = await tasks.trigger(TASK_ID, {
      schoolId,
      tenantId: schoolId,
      userId: user.id,
      paymentId,
      skipCooldown: true,
    });

    return NextResponse.json({
      ok: true,
      taskId: TASK_ID,
      runId: handle.id,
      paymentId,
    });
  } catch (error) {
    console.error("[dev/trigger-test/whatsapp-payment-reminder]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ?
            error.message
          : "Falha ao disparar task no Trigger.dev.",
        code: "TRIGGER_ERROR",
      },
      { status: 502 }
    );
  }
}
