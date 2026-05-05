import type { EscolaSettings } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function getMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export async function ensureSchoolAiUsageWindow(
  schoolId: string,
  row?: Pick<EscolaSettings, "aiUsageCount" | "aiUsageResetAt"> | null
) {
  const current = row
    ?? (await prisma.escolaSettings.findUnique({
      where: { schoolId },
      select: { aiUsageCount: true, aiUsageResetAt: true },
    }));

  if (!current) return null;

  const monthStart = getMonthStart(new Date());
  if (isSameMonth(current.aiUsageResetAt, monthStart)) {
    return current;
  }

  return prisma.escolaSettings.update({
    where: { schoolId },
    data: { aiUsageCount: 0, aiUsageResetAt: monthStart },
    select: { aiUsageCount: true, aiUsageResetAt: true },
  });
}

export async function incrementSchoolAiUsage(schoolId: string, delta = 1) {
  await prisma.escolaSettings.update({
    where: { schoolId },
    data: { aiUsageCount: { increment: delta } },
  });
}
