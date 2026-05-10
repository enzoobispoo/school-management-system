import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import {
  isTriggerTaskId,
  type TriggerTaskId,
} from "@/lib/automation/trigger-task-ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Dispara tasks Trigger.dev **somente no servidor**.
 *
 * Env na Vercel / hosting:
 * - `AUTOMATION_INGEST_SECRET` — Bearer desta rota (rotação recomendada).
 * - `TRIGGER_SECRET_KEY` — API key do projeto Trigger (SDK).
 *
 * O frontend nunca deve chamar esta URL sem proxy autenticado.
 */

const bodySchema = z.object({
  taskId: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

function safeCompare(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function POST(request: NextRequest) {
  const secret = process.env.AUTOMATION_INGEST_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "AUTOMATION_INGEST_SECRET não configurado." },
      { status: 503 }
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token || !safeCompare(token, secret)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corpo inválido.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { taskId, payload } = parsed.data;
  if (!isTriggerTaskId(taskId)) {
    return NextResponse.json({ error: "taskId não permitido." }, { status: 400 });
  }

  try {
    const handle = await tasks.trigger(taskId as TriggerTaskId, payload);
    return NextResponse.json({
      ok: true,
      taskId,
      runId: handle.id,
    });
  } catch (e) {
    console.error("[internal/automation/trigger]", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Falha ao enfileirar no Trigger.dev.",
      },
      { status: 502 }
    );
  }
}
