import { NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import {
  assertCoreFinanceWrite,
  assertFinanceRead,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";
import { assertPluggyPlanAllowed } from "@/lib/pluggy/plan-access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Enfileira sincronização Pluggy no Trigger.dev (evita timeout na Vercel). */
export async function POST() {
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

    const conn = await prisma.schoolPluggyConnection.findUnique({
      where: { schoolId },
    });
    if (!conn) {
      return NextResponse.json(
        { error: "PLUGGY_CONNECTION_NOT_FOUND", code: "PLUGGY_NOT_LINKED" },
        { status: 404 }
      );
    }

    const handle = await tasks.trigger("banking.pluggy-sync-school", {
      schoolId,
      tenantId: schoolId,
      userId: user.id,
    });

    return NextResponse.json({
      queued: true,
      runId: handle.id,
    });
  } catch (e) {
    console.error("[pluggy] sync-async POST", e);
    return NextResponse.json(
      {
        error: "PLUGGY_SYNC_ENQUEUE_FAILED",
        code: "TRIGGER_ERROR",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 502 }
    );
  }
}
