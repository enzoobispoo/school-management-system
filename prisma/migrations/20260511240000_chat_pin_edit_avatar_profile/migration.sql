-- AlterTable
ALTER TABLE "SchoolChatParticipant" ADD COLUMN "pinnedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "SchoolChatParticipant_userId_pinnedAt_idx" ON "SchoolChatParticipant"("userId", "pinnedAt");

-- AlterTable
ALTER TABLE "SchoolChatMessage" ADD COLUMN "editedAt" TIMESTAMP(3);
