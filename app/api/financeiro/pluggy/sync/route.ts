import { NextResponse } from "next/server";
import {
  assertCoreFinanceWrite,
  assertFinanceRead,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";
import { assertPluggyPlanAllowed } from "@/lib/pluggy/plan-access";
import { syncPluggyConnectionForSchool } from "@/lib/pluggy/sync-school-connection";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const result = await syncPluggyConnectionForSchool(schoolId);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    console.error("[pluggy] sync POST", e);
    return NextResponse.json(
      { error: "PLUGGY_SYNC_FAILED", code: "PLUGGY_ERROR" },
      { status: 500 }
    );
  }
}
