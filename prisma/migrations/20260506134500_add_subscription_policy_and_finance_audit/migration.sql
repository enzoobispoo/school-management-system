ALTER TABLE "EscolaSettings"
ADD COLUMN "subscriptionInadimplenciaAction" TEXT NOT NULL DEFAULT 'SUSPENDER',
ADD COLUMN "subscriptionInadimplenciaDias" INTEGER NOT NULL DEFAULT 45;

CREATE TABLE "FinanceAuditEvent" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "referenceId" TEXT,
  "message" TEXT NOT NULL,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinanceAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FinanceAuditEvent_schoolId_idx" ON "FinanceAuditEvent"("schoolId");
CREATE INDEX "FinanceAuditEvent_eventType_idx" ON "FinanceAuditEvent"("eventType");
CREATE INDEX "FinanceAuditEvent_source_idx" ON "FinanceAuditEvent"("source");
CREATE INDEX "FinanceAuditEvent_status_idx" ON "FinanceAuditEvent"("status");
CREATE INDEX "FinanceAuditEvent_createdAt_idx" ON "FinanceAuditEvent"("createdAt");

ALTER TABLE "FinanceAuditEvent"
ADD CONSTRAINT "FinanceAuditEvent_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

