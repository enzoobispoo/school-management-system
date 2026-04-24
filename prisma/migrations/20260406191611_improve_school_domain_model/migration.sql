-- CreateEnum
CREATE TYPE "OrigemEvento" AS ENUM ('MANUAL', 'AUTOMATICO');

-- CreateEnum
CREATE TYPE "ChatMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- DropIndex
DROP INDEX "Matricula_alunoId_turmaId_key";

-- =========================================================
-- AiChatMessage.role: migração segura de TEXT para ENUM
-- =========================================================

-- 1) adiciona coluna temporária
ALTER TABLE "AiChatMessage"
ADD COLUMN "role_new" "ChatMessageRole";

-- 2) converte dados existentes
UPDATE "AiChatMessage"
SET "role_new" = CASE
  WHEN "role" = 'user' THEN 'USER'::"ChatMessageRole"
  WHEN "role" = 'assistant' THEN 'ASSISTANT'::"ChatMessageRole"
  WHEN "role" = 'system' THEN 'SYSTEM'::"ChatMessageRole"
  WHEN "role" = 'USER' THEN 'USER'::"ChatMessageRole"
  WHEN "role" = 'ASSISTANT' THEN 'ASSISTANT'::"ChatMessageRole"
  WHEN "role" = 'SYSTEM' THEN 'SYSTEM'::"ChatMessageRole"
  ELSE 'USER'::"ChatMessageRole"
END;

-- 3) torna obrigatória
ALTER TABLE "AiChatMessage"
ALTER COLUMN "role_new" SET NOT NULL;

-- 4) remove coluna antiga e renomeia a nova
ALTER TABLE "AiChatMessage"
DROP COLUMN "role";

ALTER TABLE "AiChatMessage"
RENAME COLUMN "role_new" TO "role";

-- =========================================================
-- Evento.origem
-- =========================================================

ALTER TABLE "Evento"
ADD COLUMN "origem" "OrigemEvento" NOT NULL DEFAULT 'MANUAL';

-- =========================================================
-- Notificacao.updatedAt: adiciona sem quebrar registros existentes
-- =========================================================

-- 1) adiciona coluna como opcional
ALTER TABLE "Notificacao"
ADD COLUMN "updatedAt" TIMESTAMP(3);

-- 2) preenche registros antigos
UPDATE "Notificacao"
SET "updatedAt" = "createdAt"
WHERE "updatedAt" IS NULL;

-- 3) torna obrigatória
ALTER TABLE "Notificacao"
ALTER COLUMN "updatedAt" SET NOT NULL;

-- =========================================================
-- Novas tabelas
-- =========================================================

-- CreateTable
CREATE TABLE "ProfessorCurso" (
    "id" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessorCurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurmaProfessorHistorico" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "motivoTroca" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TurmaProfessorHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfessorCurso_professorId_idx" ON "ProfessorCurso"("professorId");

-- CreateIndex
CREATE INDEX "ProfessorCurso_cursoId_idx" ON "ProfessorCurso"("cursoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessorCurso_professorId_cursoId_key" ON "ProfessorCurso"("professorId", "cursoId");

-- CreateIndex
CREATE INDEX "TurmaProfessorHistorico_turmaId_idx" ON "TurmaProfessorHistorico"("turmaId");

-- CreateIndex
CREATE INDEX "TurmaProfessorHistorico_professorId_idx" ON "TurmaProfessorHistorico"("professorId");

-- CreateIndex
CREATE INDEX "TurmaProfessorHistorico_dataInicio_idx" ON "TurmaProfessorHistorico"("dataInicio");

-- CreateIndex
CREATE INDEX "TurmaProfessorHistorico_dataFim_idx" ON "TurmaProfessorHistorico"("dataFim");

-- CreateIndex
CREATE INDEX "Evento_origem_idx" ON "Evento"("origem");

-- AddForeignKey
ALTER TABLE "ProfessorCurso" ADD CONSTRAINT "ProfessorCurso_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessorCurso" ADD CONSTRAINT "ProfessorCurso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaProfessorHistorico" ADD CONSTRAINT "TurmaProfessorHistorico_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaProfessorHistorico" ADD CONSTRAINT "TurmaProfessorHistorico_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAuditLog" ADD CONSTRAINT "AiAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiChatSession" ADD CONSTRAINT "AiChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;