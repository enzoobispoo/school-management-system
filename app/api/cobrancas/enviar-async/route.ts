import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import {
  assertBillingNotify,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Enfileira lembrete WhatsApp no Trigger.dev (evita timeout no cliente / edge).
 * Requer `TRIGGER_SECRET_KEY` no ambiente do servidor.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const denied = assertBillingNotify(user);
    if (denied) return denied;

    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId é obrigatório" },
        { status: 400 }
      );
    }

    const handle = await tasks.trigger("whatsapp.payment-reminder", {
      schoolId,
      tenantId: schoolId,
      userId: user.id,
      paymentId,
      skipCooldown: false,
    });

    return NextResponse.json({
      queued: true,
      runId: handle.id,
    });
  } catch (error) {
    console.error("[cobrancas/enviar-async]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ?
            error.message
          : "Falha ao enfileirar lembrete.",
      },
      { status: 502 }
    );
  }
}
