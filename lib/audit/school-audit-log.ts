import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type SchoolAuditDomain = "finance" | "enrollment";

export async function logSchoolAudit(params: {
  schoolId: string;
  userId: string;
  role: string;
  domain: SchoolAuditDomain;
  action: string;
  resourceId?: string | null;
  summary: string;
  payload?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    const summary =
      params.summary.length > 500 ?
        `${params.summary.slice(0, 497)}...`
      : params.summary;

    await prisma.schoolAuditLog.create({
      data: {
        schoolId: params.schoolId,
        userId: params.userId,
        role: params.role,
        domain: params.domain,
        action: params.action,
        resourceId: params.resourceId ?? null,
        summary,
        payload:
          params.payload === undefined || params.payload === null ?
            undefined
          : (params.payload as Prisma.InputJsonValue),
      },
    });
  } catch (error) {
    console.error("[SchoolAuditLog]", error);
  }
}
