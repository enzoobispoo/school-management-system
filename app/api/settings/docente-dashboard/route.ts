import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";
import {
  DOCENTE_DASHBOARD_DEFAULTS,
  normalizeDocenteDashboardConfig,
} from "@/lib/docente/dashboard-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SCHOOL_CONFIG_EDIT_ROLES = new Set(["ADMIN", "SECRETARIA", "SUPER_ADMIN"]);

export async function GET() {
  const user = await getCurrentUser();
  const schoolResult = requireSchool(user);
  if (schoolResult instanceof NextResponse) return schoolResult;
  const { schoolId } = schoolResult;

  const record = await prisma.docenteDashboardConfig.findUnique({
    where: {
      schoolId_role: {
        schoolId,
        role: "PROFESSOR",
      },
    },
  });

  const config = normalizeDocenteDashboardConfig(
    record
      ? {
          minAttendancePercent: record.minAttendancePercent,
          minAttendanceSamples: record.minAttendanceSamples,
          minGrade: Number(record.minGrade),
          minGradeSamples: record.minGradeSamples,
          weeklyCallsTarget: record.weeklyCallsTarget ?? undefined,
          weeklyAssessmentsTarget: record.weeklyAssessmentsTarget ?? undefined,
          weeklyGradesTarget: record.weeklyGradesTarget ?? undefined,
        }
      : null
  );

  return NextResponse.json({
    role: "PROFESSOR",
    defaultConfig: DOCENTE_DASHBOARD_DEFAULTS,
    schoolConfig: config,
  });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  const schoolResult = requireSchool(user);
  if (schoolResult instanceof NextResponse) return schoolResult;
  const { schoolId } = schoolResult;

  if (!user || !SCHOOL_CONFIG_EDIT_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const body = await request.json();
  const config = normalizeDocenteDashboardConfig(body);

  const saved = await prisma.docenteDashboardConfig.upsert({
    where: {
      schoolId_role: {
        schoolId,
        role: "PROFESSOR",
      },
    },
    update: {
      minAttendancePercent: config.minAttendancePercent,
      minAttendanceSamples: config.minAttendanceSamples,
      minGrade: config.minGrade,
      minGradeSamples: config.minGradeSamples,
      weeklyCallsTarget: config.weeklyCallsTarget,
      weeklyAssessmentsTarget: config.weeklyAssessmentsTarget,
      weeklyGradesTarget: config.weeklyGradesTarget,
    },
    create: {
      schoolId,
      role: "PROFESSOR",
      minAttendancePercent: config.minAttendancePercent,
      minAttendanceSamples: config.minAttendanceSamples,
      minGrade: config.minGrade,
      minGradeSamples: config.minGradeSamples,
      weeklyCallsTarget: config.weeklyCallsTarget,
      weeklyAssessmentsTarget: config.weeklyAssessmentsTarget,
      weeklyGradesTarget: config.weeklyGradesTarget,
    },
  });

  return NextResponse.json({
    ok: true,
    schoolConfig: {
      minAttendancePercent: saved.minAttendancePercent,
      minAttendanceSamples: saved.minAttendanceSamples,
      minGrade: Number(saved.minGrade),
      minGradeSamples: saved.minGradeSamples,
      weeklyCallsTarget: saved.weeklyCallsTarget ?? undefined,
      weeklyAssessmentsTarget: saved.weeklyAssessmentsTarget ?? undefined,
      weeklyGradesTarget: saved.weeklyGradesTarget ?? undefined,
    },
  });
}
