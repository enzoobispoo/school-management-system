import { NextRequest, NextResponse } from "next/server";
import { assertFinanceRead, getCurrentUser, requireSchool } from "@/lib/auth";
import { assertPluggyPlanAllowed } from "@/lib/pluggy/plan-access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

    const limit = Math.min(
      200,
      Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? "40"))
    );
    const accountId = request.nextUrl.searchParams.get("accountId");

    const transactions = await prisma.pluggyTransaction.findMany({
      where: {
        schoolId,
        ...(accountId ? { accountId } : {}),
      },
      orderBy: { date: "desc" },
      take: limit,
      include: {
        account: { select: { name: true, pluggyAccountId: true } },
      },
    });

    return NextResponse.json({ transactions });
  } catch (e) {
    console.error("[pluggy] transactions GET", e);
    return NextResponse.json(
      { error: "PLUGGY_TRANSACTIONS_FAILED", code: "PLUGGY_ERROR" },
      { status: 500 }
    );
  }
}
