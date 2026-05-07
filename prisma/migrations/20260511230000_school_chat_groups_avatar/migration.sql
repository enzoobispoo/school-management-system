-- CreateEnum
CREATE TYPE "SchoolChatThreadKind" AS ENUM ('DIRECT', 'GROUP');

-- CreateEnum
CREATE TYPE "SchoolChatWritePolicy" AS ENUM ('ALL_MEMBERS', 'OWNER_ONLY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;

-- AlterTable
ALTER TABLE "SchoolChatThread" ADD COLUMN "kind" "SchoolChatThreadKind" NOT NULL DEFAULT 'DIRECT';
ALTER TABLE "SchoolChatThread" ADD COLUMN "title" TEXT;
ALTER TABLE "SchoolChatThread" ADD COLUMN "ownerUserId" TEXT;
ALTER TABLE "SchoolChatThread" ADD COLUMN "writePolicy" "SchoolChatWritePolicy" NOT NULL DEFAULT 'ALL_MEMBERS';

-- CreateIndex
CREATE INDEX "SchoolChatThread_schoolId_kind_idx" ON "SchoolChatThread"("schoolId", "kind");

-- AddForeignKey
ALTER TABLE "SchoolChatThread" ADD CONSTRAINT "SchoolChatThread_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
