-- CreateTable
CREATE TABLE "DocenteDashboardConfig" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PROFESSOR',
    "minAttendancePercent" INTEGER NOT NULL DEFAULT 75,
    "minAttendanceSamples" INTEGER NOT NULL DEFAULT 4,
    "minGrade" DECIMAL(4,2) NOT NULL DEFAULT 6.0,
    "minGradeSamples" INTEGER NOT NULL DEFAULT 2,
    "weeklyCallsTarget" INTEGER,
    "weeklyAssessmentsTarget" INTEGER,
    "weeklyGradesTarget" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocenteDashboardConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocenteDashboardConfig_schoolId_idx" ON "DocenteDashboardConfig"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "DocenteDashboardConfig_schoolId_role_key" ON "DocenteDashboardConfig"("schoolId", "role");

-- AddForeignKey
ALTER TABLE "DocenteDashboardConfig" ADD CONSTRAINT "DocenteDashboardConfig_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
