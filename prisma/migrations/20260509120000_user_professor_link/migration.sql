-- AlterTable
ALTER TABLE "User" ADD COLUMN "professorId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_professorId_key" ON "User"("professorId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
