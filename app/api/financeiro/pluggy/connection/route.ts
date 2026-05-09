import { NextRequest, NextResponse } from "next/server";
import { PluggyConnectionStatus } from "@prisma/client";
import {
  assertCoreFinanceWrite,
  assertFinanceRead,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";
import { encryptPluggyEnvelope } from "@/lib/crypto/pluggy-credentials-crypto";
import { assertPluggyPlanAllowed } from "@/lib/pluggy/plan-access";
import { getPluggyServerClient } from "@/lib/pluggy/client";
import { withPluggyRetry } from "@/lib/pluggy/retry";
import { syncPluggyConnectionForSchool } from "@/lib/pluggy/sync-school-connection";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const finRead = assertFinanceRead(user);
    if (finRead) return finRead;
    const finWrite = assertCoreFinanceWrite(user);
    if (finWrite) return finWrite;

    const schoolResult = requireSchool(user);
    if (schoolResult instanceof NextResponse) return schoolResult;
    const { schoolId } = schoolResult;

    const planBlock = await assertPluggyPlanAllowed(schoolId);
    if (planBlock) return planBlock;

    const body = (await request.json().catch(() => ({}))) as { itemId?: string };
    const itemId = String(body?.itemId ?? "").trim();
    if (!itemId) {
      return NextResponse.json({ error: "itemId obrigatório." }, { status: 400 });
    }

    const client = getPluggyServerClient();
    const item = await withPluggyRetry(() => client.fetchItem(itemId));

    if (item.clientUserId !== schoolId) {
      return NextResponse.json(
        { error: "ITEM_SCHOOL_MISMATCH", code: "PLUGGY_FORBIDDEN" },
        { status: 403 }
      );
    }

    const envelopePayload = JSON.stringify({
      v: 1,
      schoolId,
      itemId,
      connectorId: item.connector.id,
      sealedAt: new Date().toISOString(),
    });
    const envelope = encryptPluggyEnvelope(envelopePayload);

    const existing = await prisma.schoolPluggyConnection.findUnique({
      where: { schoolId },
    });
    if (existing && existing.pluggyItemId !== itemId) {
      await withPluggyRetry(() => client.deleteItem(existing.pluggyItemId)).catch(
        () => {}
      );
      await prisma.schoolPluggyConnection.delete({ where: { schoolId } });
    }

    const statusConn =
      item.status === "LOGIN_ERROR" ? PluggyConnectionStatus.ERROR : PluggyConnectionStatus.ACTIVE;

    await prisma.schoolPluggyConnection.upsert({
      where: { schoolId },
      create: {
        schoolId,
        pluggyItemId: itemId,
        connectorId: item.connector.id,
        institutionName: item.connector.name,
        institutionUrl: item.connector.institutionUrl ?? null,
        status: statusConn,
        pluggyItemStatus: item.status,
        lastPluggyItemUpdateAt: item.updatedAt,
        encryptedCredentialEnvelope: envelope,
        lastSyncError:
          item.status === "LOGIN_ERROR" ?
            (item.error?.message ?? "LOGIN_ERROR").slice(0, 4000)
          : null,
      },
      update: {
        pluggyItemId: itemId,
        connectorId: item.connector.id,
        institutionName: item.connector.name,
        institutionUrl: item.connector.institutionUrl ?? null,
        status: statusConn,
        pluggyItemStatus: item.status,
        lastPluggyItemUpdateAt: item.updatedAt,
        encryptedCredentialEnvelope: envelope,
        lastSyncError:
          item.status === "LOGIN_ERROR" ?
            (item.error?.message ?? "LOGIN_ERROR").slice(0, 4000)
          : null,
      },
    });

    if (item.status !== "LOGIN_ERROR") {
      await syncPluggyConnectionForSchool(schoolId);
    }

    const row = await prisma.schoolPluggyConnection.findUnique({
      where: { schoolId },
    });

    return NextResponse.json({ connection: row });
  } catch (e) {
    console.error("[pluggy] connection POST", e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("PLUGGY_CREDENTIALS_ENCRYPTION_KEY")) {
      return NextResponse.json(
        {
          code: "PLUGGY_ENCRYPTION_KEY_MISSING",
          error: "Server encryption key not configured.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "PLUGGY_CONNECTION_SAVE_FAILED", code: "PLUGGY_ERROR" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const finRead = assertFinanceRead(user);
    if (finRead) return finRead;
    const finWrite = assertCoreFinanceWrite(user);
    if (finWrite) return finWrite;

    const schoolResult = requireSchool(user);
    if (schoolResult instanceof NextResponse) return schoolResult;
    const { schoolId } = schoolResult;

    const planBlock = await assertPluggyPlanAllowed(schoolId);
    if (planBlock) return planBlock;

    const existing = await prisma.schoolPluggyConnection.findUnique({
      where: { schoolId },
    });
    if (!existing) {
      return NextResponse.json({ ok: true });
    }

    const client = getPluggyServerClient();
    await withPluggyRetry(() => client.deleteItem(existing.pluggyItemId)).catch(
      () => {}
    );

    await prisma.schoolPluggyConnection.delete({ where: { schoolId } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[pluggy] connection DELETE", e);
    return NextResponse.json(
      { error: "PLUGGY_CONNECTION_DELETE_FAILED", code: "PLUGGY_ERROR" },
      { status: 500 }
    );
  }
}
