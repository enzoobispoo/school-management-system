export type DocenteDashboardConfigValues = {
  minAttendancePercent: number;
  minAttendanceSamples: number;
  minGrade: number;
  minGradeSamples: number;
  weeklyCallsTarget: number;
  weeklyAssessmentsTarget: number;
  weeklyGradesTarget: number;
};

export const DOCENTE_DASHBOARD_DEFAULTS: DocenteDashboardConfigValues = {
  minAttendancePercent: 75,
  minAttendanceSamples: 4,
  minGrade: 6,
  minGradeSamples: 2,
  weeklyCallsTarget: 10,
  weeklyAssessmentsTarget: 2,
  weeklyGradesTarget: 8,
};

function clampInt(value: unknown, fallback: number, min: number, max: number) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, Math.round(num)));
}

function clampFloat(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
  precision = 2
) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const clamped = Math.max(min, Math.min(max, num));
  return Number(clamped.toFixed(precision));
}

export function normalizeDocenteDashboardConfig(
  raw: Partial<DocenteDashboardConfigValues> | null | undefined,
  fallback: DocenteDashboardConfigValues = DOCENTE_DASHBOARD_DEFAULTS
): DocenteDashboardConfigValues {
  return {
    minAttendancePercent: clampInt(
      raw?.minAttendancePercent,
      fallback.minAttendancePercent,
      40,
      100
    ),
    minAttendanceSamples: clampInt(
      raw?.minAttendanceSamples,
      fallback.minAttendanceSamples,
      1,
      20
    ),
    minGrade: clampFloat(raw?.minGrade, fallback.minGrade, 0, 10, 2),
    minGradeSamples: clampInt(
      raw?.minGradeSamples,
      fallback.minGradeSamples,
      1,
      10
    ),
    weeklyCallsTarget: clampInt(
      raw?.weeklyCallsTarget,
      fallback.weeklyCallsTarget,
      1,
      200
    ),
    weeklyAssessmentsTarget: clampInt(
      raw?.weeklyAssessmentsTarget,
      fallback.weeklyAssessmentsTarget,
      1,
      50
    ),
    weeklyGradesTarget: clampInt(
      raw?.weeklyGradesTarget,
      fallback.weeklyGradesTarget,
      1,
      400
    ),
  };
}
