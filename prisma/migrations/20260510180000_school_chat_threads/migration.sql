-- CreateTable
CREATE TABLE "SchoolChatThread" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "dmKey" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolChatThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolChatParticipant" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolChatParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolChatMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "attachmentName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SchoolChatThread_schoolId_dmKey_key" ON "SchoolChatThread"("schoolId", "dmKey");

CREATE INDEX "SchoolChatThread_schoolId_lastMessageAt_idx" ON "SchoolChatThread"("schoolId", "lastMessageAt");

CREATE UNIQUE INDEX "SchoolChatParticipant_threadId_userId_key" ON "SchoolChatParticipant"("threadId", "userId");

CREATE INDEX "SchoolChatParticipant_userId_idx" ON "SchoolChatParticipant"("userId");

CREATE INDEX "SchoolChatMessage_threadId_createdAt_idx" ON "SchoolChatMessage"("threadId", "createdAt");

ALTER TABLE "SchoolChatThread" ADD CONSTRAINT "SchoolChatThread_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SchoolChatParticipant" ADD CONSTRAINT "SchoolChatParticipant_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "SchoolChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SchoolChatParticipant" ADD CONSTRAINT "SchoolChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SchoolChatMessage" ADD CONSTRAINT "SchoolChatMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "SchoolChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SchoolChatMessage" ADD CONSTRAINT "SchoolChatMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
