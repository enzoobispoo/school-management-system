import type {
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

const OPEN_LIKE: IncidentStatus[] = ["OPEN", "ACKNOWLEDGED"];

const INCIDENT_CATEGORIES: IncidentCategory[] = [
  "FINANCE",
  "ACADEMIC",
  "ENROLLMENT",
  "SYSTEM",
];

function parseCategory(
  raw: string | undefined
): IncidentCategory | undefined {
  if (!raw?.trim()) return undefined;
  const u = raw.trim().toUpperCase();
  return INCIDENT_CATEGORIES.includes(u as IncidentCategory)
    ? (u as IncidentCategory)
    : undefined;
}

export async function queryOperationalIncidents(
  args: {
    /** Se true (default), só incidentes ainda não resolvidos ou dispensados. */
    onlyOpen?: boolean;
    severity?: IncidentSeverity;
    category?: string;
    limit?: number;
  },
  schoolId?: string | null
) {
  const sid = schoolId?.trim();
  const limit = Math.min(Math.max(Number(args.limit) || 18, 1), 40);
  if (!sid) {
    return { error: "school_missing", incidentes: [] as unknown[] };
  }

  const onlyOpen = args.onlyOpen !== false;

  const category = parseCategory(args.category);

  const rows = await prisma.operationalIncident.findMany({
    where: {
      schoolId: sid,
      ...(onlyOpen ? { status: { in: OPEN_LIKE } } : {}),
      ...(args.severity ? { severity: args.severity } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: [{ severity: "desc" }, { lastDetectedAt: "desc" }],
    take: limit,
    select: {
      id: true,
      title: true,
      severity: true,
      status: true,
      category: true,
      playbookCode: true,
      dedupeKey: true,
      lastDetectedAt: true,
    },
  });

  return {
    incidentes: rows.map((r) => ({
      ...r,
      lastDetectedAt: r.lastDetectedAt.toISOString(),
    })),
  };
}
