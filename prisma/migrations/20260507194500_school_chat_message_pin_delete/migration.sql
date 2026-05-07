-- AlterTable
ALTER TABLE "SchoolChatParticipant" ADD COLUMN "hiddenMessageIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "SchoolChatMessage" ADD COLUMN "pinnedAt" TIMESTAMP(3),
ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "SchoolChatMessage_threadId_pinnedAt_idx" ON "SchoolChatMessage"("threadId", "pinnedAt");
