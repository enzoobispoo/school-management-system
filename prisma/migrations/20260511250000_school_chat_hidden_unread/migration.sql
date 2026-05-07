-- AlterTable
ALTER TABLE "SchoolChatParticipant" ADD COLUMN "hiddenAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "SchoolChatParticipant_userId_hiddenAt_idx" ON "SchoolChatParticipant"("userId", "hiddenAt");
