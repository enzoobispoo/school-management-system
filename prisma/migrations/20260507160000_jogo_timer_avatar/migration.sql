-- AlterTable
ALTER TABLE "JogoSessao" ADD COLUMN "tempoPorQuestaoSegundos" INTEGER,
ADD COLUMN "questaoDeadlineAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "JogoParticipante" ADD COLUMN "avatarEmoji" TEXT NOT NULL DEFAULT '🎓';
