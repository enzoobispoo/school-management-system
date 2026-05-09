import "server-only";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  normalizePlanTier,
  planAllowsPluggyOpenFinance,
  type PlanTier,
} from "@/lib/school-plan";

export function pluggyPlanForbiddenResponse(): NextResponse {
  return NextResponse.json(
    {
      code: "PLUGGY_REQUIRES_FULL_PLAN",
      error: "OPEN_FINANCE_REQUIRES_FULL_PLAN",
    },
    { status: 403 }
  );
}

export async function loadSchoolPlanTier(schoolId: string): Promise<PlanTier> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { plano: true },
  });
  return normalizePlanTier(school?.plano);
}

export async function assertPluggyPlanAllowed(schoolId: string): Promise<NextResponse | null> {
  const tier = await loadSchoolPlanTier(schoolId);
  if (!planAllowsPluggyOpenFinance(tier)) {
    return pluggyPlanForbiddenResponse();
  }
  return null;
}
