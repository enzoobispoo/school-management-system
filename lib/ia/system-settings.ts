import { prisma } from "@/lib/prisma";
import type { SystemSetting } from "@prisma/client";

function getMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function isSameMonth(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth()
  );
}

export function maskApiKey(apiKey: string | null | undefined) {
  if (!apiKey) return null;

  const trimmed = apiKey.trim();
  if (trimmed.length <= 10) return "••••••••";

  return `${trimmed.slice(0, 6)}••••••${trimmed.slice(-4)}`;
}

export async function getOrCreateSystemSetting() {
  return prisma.systemSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
    },
  });
}

export async function ensureCurrentAiUsageWindow(
  settings?: SystemSetting
) {
  const currentSettings = settings ?? (await getOrCreateSystemSetting());
  const currentMonthStart = getMonthStart(new Date());

  if (!isSameMonth(currentSettings.aiUsageResetAt, currentMonthStart)) {
    return prisma.systemSetting.update({
      where: { id: currentSettings.id },
      data: {
        aiUsageCount: 0,
        aiUsageResetAt: currentMonthStart,
      },
    });
  }

  return currentSettings;
}

export async function incrementPlatformAiUsage() {
  await prisma.systemSetting.update({
    where: { id: "default" },
    data: {
      aiUsageCount: {
        increment: 1,
      },
    },
  });
}