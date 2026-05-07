-- AlterTable
ALTER TABLE "AiAuditLog" ADD COLUMN "schoolId" TEXT,
ADD COLUMN "correlationId" TEXT,
ADD COLUMN "toolRuns" JSONB;

-- CreateIndex
CREATE INDEX "AiAuditLog_schoolId_idx" ON "AiAuditLog"("schoolId");

-- CreateIndex
CREATE INDEX "AiAuditLog_correlationId_idx" ON "AiAuditLog"("correlationId");

-- CreateIndex
CREATE INDEX "Pagamento_schoolId_status_dataPagamento_idx" ON "Pagamento"("schoolId", "status", "dataPagamento");
