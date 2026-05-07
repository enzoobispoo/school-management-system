-- CreateEnum
CREATE TYPE "FormatoAvaliacao" AS ENUM ('CLASSICA', 'JOGO');

-- AlterTable
ALTER TABLE "Avaliacao" ADD COLUMN "formato" "FormatoAvaliacao" NOT NULL DEFAULT 'CLASSICA';

-- CreateTable
CREATE TABLE "AvaliacaoQuestao" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "avaliacaoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "enunciado" TEXT NOT NULL,
    "explicacao" TEXT,
    "pontos" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvaliacaoQuestao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvaliacaoAlternativa" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvaliacaoAlternativa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvaliacaoQuestao_schoolId_idx" ON "AvaliacaoQuestao"("schoolId");

-- CreateIndex
CREATE INDEX "AvaliacaoQuestao_avaliacaoId_ordem_idx" ON "AvaliacaoQuestao"("avaliacaoId", "ordem");

-- CreateIndex
CREATE INDEX "AvaliacaoAlternativa_schoolId_idx" ON "AvaliacaoAlternativa"("schoolId");

-- CreateIndex
CREATE INDEX "AvaliacaoAlternativa_questaoId_ordem_idx" ON "AvaliacaoAlternativa"("questaoId", "ordem");

-- AddForeignKey
ALTER TABLE "AvaliacaoQuestao" ADD CONSTRAINT "AvaliacaoQuestao_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoQuestao" ADD CONSTRAINT "AvaliacaoQuestao_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "Avaliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoAlternativa" ADD CONSTRAINT "AvaliacaoAlternativa_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoAlternativa" ADD CONSTRAINT "AvaliacaoAlternativa_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "AvaliacaoQuestao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
