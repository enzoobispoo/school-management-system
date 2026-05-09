import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncPluggyConnectionForSchool } from "@/lib/pluggy/sync-school-connection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhooks Pluggy (`item/*`, `transactions/*`).
 * Configure `pluggyWebhookUrl()` em produção (NEXT_PUBLIC_APP_URL / VERCEL_URL).
 * Validação adicional por assinatura pode ser acrescentada quando o segredo estiver em env.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const payload = body as { event?: string; itemId?: string };
    const event = payload.event ?? "";
    const itemId = payload.itemId;

    if (
      !itemId ||
      (!event.startsWith("item/") && !event.startsWith("transactions/"))
    ) {
      return NextResponse.json({ ok: true });
    }

    const row = await prisma.schoolPluggyConnection.findUnique({
      where: { pluggyItemId: itemId },
    });
    if (!row) {
      return NextResponse.json({ ok: true });
    }

    void syncPluggyConnectionForSchool(row.schoolId).catch((err) => {
      console.error("[pluggy] webhook sync failed", err);
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[pluggy] webhook", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
