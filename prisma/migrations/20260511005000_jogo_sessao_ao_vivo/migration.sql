-- CreateEnum
CREATE TYPE "JogoSessaoStatus" AS ENUM ('LOBBY', 'RUNNING', 'FINISHED');

-- CreateTable
CREATE TABLE "JogoSessao" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "avaliacaoId" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "status" "JogoSessaoStatus" NOT NULL DEFAULT 'LOBBY',
    "questaoAtualOrdem" INTEGER NOT NULL DEFAULT 1,
    "createdByProfessorId" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JogoSessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JogoParticipante" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "score" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JogoParticipante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JogoResposta" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "participanteId" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "alternativaId" TEXT,
    "correta" BOOLEAN NOT NULL,
    "pontos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JogoResposta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JogoSessao_pin_key" ON "JogoSessao"("pin");

-- CreateIndex
CREATE INDEX "JogoSessao_schoolId_idx" ON "JogoSessao"("schoolId");
CREATE INDEX "JogoSessao_avaliacaoId_createdAt_idx" ON "JogoSessao"("avaliacaoId", "createdAt");

-- CreateIndex
CREATE INDEX "JogoParticipante_schoolId_idx" ON "JogoParticipante"("schoolId");
CREATE INDEX "JogoParticipante_sessaoId_createdAt_idx" ON "JogoParticipante"("sessaoId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "JogoResposta_participanteId_questaoId_key" ON "JogoResposta"("participanteId", "questaoId");
CREATE INDEX "JogoResposta_schoolId_idx" ON "JogoResposta"("schoolId");
CREATE INDEX "JogoResposta_questaoId_createdAt_idx" ON "JogoResposta"("questaoId", "createdAt");

-- AddForeignKey
ALTER TABLE "JogoSessao" ADD CONSTRAINT "JogoSessao_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JogoSessao" ADD CONSTRAINT "JogoSessao_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "Avaliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JogoParticipante" ADD CONSTRAINT "JogoParticipante_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JogoParticipante" ADD CONSTRAINT "JogoParticipante_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "JogoSessao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JogoResposta" ADD CONSTRAINT "JogoResposta_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JogoResposta" ADD CONSTRAINT "JogoResposta_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "JogoParticipante"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JogoResposta" ADD CONSTRAINT "JogoResposta_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "AvaliacaoQuestao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JogoResposta" ADD CONSTRAINT "JogoResposta_alternativaId_fkey" FOREIGN KEY ("alternativaId") REFERENCES "AvaliacaoAlternativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
