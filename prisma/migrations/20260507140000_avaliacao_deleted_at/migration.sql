-- AlterTable
ALTER TABLE "Avaliacao" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Avaliacao_schoolId_deletedAt_idx" ON "Avaliacao"("schoolId", "deletedAt");
