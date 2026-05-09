-- Open Finance / Open Banking: vínculo por escola (consentimento; dados sensíveis via provedor credenciado).
CREATE TYPE "OpenFinanceConnectionStatus" AS ENUM ('DISCONNECTED', 'PENDING_CONSENT', 'ACTIVE', 'ERROR');

CREATE TABLE "SchoolOpenFinanceConnection" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "status" "OpenFinanceConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "provider" TEXT NOT NULL DEFAULT 'stub',
    "consentExternalId" TEXT,
    "institutionHint" TEXT,
    "lastError" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolOpenFinanceConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SchoolOpenFinanceConnection_schoolId_key" ON "SchoolOpenFinanceConnection"("schoolId");
CREATE INDEX "SchoolOpenFinanceConnection_schoolId_idx" ON "SchoolOpenFinanceConnection"("schoolId");
CREATE INDEX "SchoolOpenFinanceConnection_status_idx" ON "SchoolOpenFinanceConnection"("status");

ALTER TABLE "SchoolOpenFinanceConnection" ADD CONSTRAINT "SchoolOpenFinanceConnection_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
