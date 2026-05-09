import { NextResponse } from "next/server";
import { assertFinanceRead, getCurrentUser, requireSchool } from "@/lib/auth";
import { assertPluggyPlanAllowed } from "@/lib/pluggy/plan-access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const finRead = assertFinanceRead(user);
    if (finRead) return finRead;

    const schoolResult = requireSchool(user);
    if (schoolResult instanceof NextResponse) return schoolResult;
    const { schoolId } = schoolResult;

    const planBlock = await assertPluggyPlanAllowed(schoolId);
    if (planBlock) return planBlock;

    const accounts = await prisma.pluggyAccount.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ accounts });
  } catch (e) {
    console.error("[pluggy] accounts GET", e);
    return NextResponse.json(
      { error: "PLUGGY_ACCOUNTS_FAILED", code: "PLUGGY_ERROR" },
      { status: 500 }
    );
  }
}
