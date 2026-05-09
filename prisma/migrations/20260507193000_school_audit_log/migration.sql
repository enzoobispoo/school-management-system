-- Auditoria de ações humanas (financeiro / matrícula) por usuário da escola.
CREATE TABLE "SchoolAuditLog" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceId" TEXT,
    "summary" VARCHAR(500) NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SchoolAuditLog_schoolId_createdAt_idx" ON "SchoolAuditLog"("schoolId", "createdAt");
CREATE INDEX "SchoolAuditLog_domain_action_idx" ON "SchoolAuditLog"("domain", "action");

ALTER TABLE "SchoolAuditLog" ADD CONSTRAINT "SchoolAuditLog_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchoolAuditLog" ADD CONSTRAINT "SchoolAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
