-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "IncidentCategory" AS ENUM ('FINANCE', 'ACADEMIC', 'ENROLLMENT', 'SYSTEM');

-- CreateTable
CREATE TABLE "OperationalIncident" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "playbookCode" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "category" "IncidentCategory" NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "problemStatement" TEXT NOT NULL,
    "suggestedActions" JSONB NOT NULL,
    "impactHint" TEXT,
    "contextJson" JSONB,
    "lastDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastNotifiedAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "dismissedAt" TIMESTAMP(3),
    "dismissedById" TEXT,
    "dismissReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalPlaybook" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "definitionJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalPlaybook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalPlaybookRun" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "playbookId" TEXT NOT NULL,
    "playbookCode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "detailJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalPlaybookRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperationalIncident_schoolId_dedupeKey_key" ON "OperationalIncident"("schoolId", "dedupeKey");

-- CreateIndex
CREATE INDEX "OperationalIncident_schoolId_status_idx" ON "OperationalIncident"("schoolId", "status");

-- CreateIndex
CREATE INDEX "OperationalIncident_schoolId_severity_idx" ON "OperationalIncident"("schoolId", "severity");

-- CreateIndex
CREATE INDEX "OperationalIncident_lastDetectedAt_idx" ON "OperationalIncident"("lastDetectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OperationalPlaybook_code_key" ON "OperationalPlaybook"("code");

-- CreateIndex
CREATE INDEX "OperationalPlaybook_active_idx" ON "OperationalPlaybook"("active");

-- CreateIndex
CREATE INDEX "OperationalPlaybookRun_schoolId_idx" ON "OperationalPlaybookRun"("schoolId");

-- CreateIndex
CREATE INDEX "OperationalPlaybookRun_playbookId_idx" ON "OperationalPlaybookRun"("playbookId");

-- CreateIndex
CREATE INDEX "OperationalPlaybookRun_createdAt_idx" ON "OperationalPlaybookRun"("createdAt");

-- AddForeignKey
ALTER TABLE "OperationalIncident" ADD CONSTRAINT "OperationalIncident_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalPlaybookRun" ADD CONSTRAINT "OperationalPlaybookRun_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalPlaybookRun" ADD CONSTRAINT "OperationalPlaybookRun_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "OperationalPlaybook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
