import { NextResponse } from "next/server";
import { assertFinanceRead, getCurrentUser, requireSchool } from "@/lib/auth";
import { loadSchoolPlanTier } from "@/lib/pluggy/plan-access";
import { roleHasCoreFinanceWrite } from "@/lib/auth/school-permissions";
import { planAllowsPluggyOpenFinance } from "@/lib/school-plan";
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

    const tier = await loadSchoolPlanTier(schoolId);
    const pluggyAllowed = planAllowsPluggyOpenFinance(tier);

    if (!pluggyAllowed) {
      return NextResponse.json({
        pluggyAllowed: false,
        planTier: tier,
        canManageWrites: roleHasCoreFinanceWrite(user.role),
        connection: null,
        consolidatedBankBalance: null,
        recentTransactions: [],
        unreconciledCredits: 0,
        reconciledTransactions: 0,
        lastSyncAt: null,
        lastSyncError: null,
      });
    }

    const connection = await prisma.schoolPluggyConnection.findUnique({
      where: { schoolId },
    });

    const bankAgg = await prisma.pluggyAccount.aggregate({
      where: { schoolId, type: "BANK" },
      _sum: { balance: true },
    });

    const recentTransactions = await prisma.pluggyTransaction.findMany({
      where: { schoolId },
      orderBy: { date: "desc" },
      take: 12,
      include: {
        account: { select: { name: true } },
      },
    });

    const unreconciledCredits = await prisma.pluggyTransaction.count({
      where: {
        schoolId,
        reconciledPagamentoId: null,
        type: "CREDIT",
      },
    });

    const reconciledTransactions = await prisma.pluggyTransaction.count({
      where: { schoolId, reconciledPagamentoId: { not: null } },
    });

    const lastLog = await prisma.pluggySyncLog.findFirst({
      where: { schoolId },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json({
      pluggyAllowed: true,
      planTier: tier,
      canManageWrites: roleHasCoreFinanceWrite(user.role),
      connection,
      consolidatedBankBalance: bankAgg._sum.balance,
      recentTransactions,
      unreconciledCredits,
      reconciledTransactions,
      lastSyncAt: connection?.lastSyncedAt ?? null,
      lastSyncError: connection?.lastSyncError ?? null,
      lastSyncLogStatus: lastLog?.status ?? null,
    });
  } catch (e) {
    console.error("[pluggy] overview GET", e);
    return NextResponse.json(
      { error: "PLUGGY_OVERVIEW_FAILED", code: "PLUGGY_ERROR" },
      { status: 500 }
    );
  }
}
