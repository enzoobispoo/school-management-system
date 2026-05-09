import { NextResponse } from "next/server";
import {
  assertCoreFinanceWrite,
  assertFinanceRead,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";
import { assertPluggyPlanAllowed } from "@/lib/pluggy/plan-access";
import { getPluggyServerClient } from "@/lib/pluggy/client";
import { pluggyWebhookUrl } from "@/lib/pluggy/env";

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

    const client = getPluggyServerClient();
    const token = await client.createConnectToken(undefined, {
      clientUserId: schoolId,
      webhookUrl: pluggyWebhookUrl(),
    });

    return NextResponse.json({ connectToken: token.accessToken });
  } catch (e) {
    console.error("[pluggy] connect-token", e);
    return NextResponse.json(
      { error: "PLUGGY_CONNECT_TOKEN_FAILED", code: "PLUGGY_ERROR" },
      { status: 500 }
    );
  }
}
