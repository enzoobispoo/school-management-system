-- CreateEnum
CREATE TYPE "TipoMaterialDidatico" AS ENUM ('SLIDE', 'ATIVIDADE_IMPRESSAO', 'PROVA_IMPRESSAO', 'PLANO_AULA', 'REFERENCIA', 'OUTRO');

-- AlterTable
ALTER TABLE "AlunoRegistro" ADD COLUMN "professorId" TEXT;

-- CreateTable
CREATE TABLE "MaterialDidatico" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "turmaId" TEXT,
    "disciplinaId" TEXT,
    "tipo" "TipoMaterialDidatico" NOT NULL DEFAULT 'OUTRO',
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "arquivoUrl" TEXT NOT NULL,
    "arquivoNome" TEXT NOT NULL,
    "mimeType" TEXT,
    "tamanhoBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialDidatico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlunoRegistro_professorId_idx" ON "AlunoRegistro"("professorId");

-- CreateIndex
CREATE INDEX "MaterialDidatico_schoolId_idx" ON "MaterialDidatico"("schoolId");

-- CreateIndex
CREATE INDEX "MaterialDidatico_professorId_idx" ON "MaterialDidatico"("professorId");

-- CreateIndex
CREATE INDEX "MaterialDidatico_turmaId_idx" ON "MaterialDidatico"("turmaId");

-- CreateIndex
CREATE INDEX "MaterialDidatico_disciplinaId_idx" ON "MaterialDidatico"("disciplinaId");

-- CreateIndex
CREATE INDEX "MaterialDidatico_tipo_idx" ON "MaterialDidatico"("tipo");

-- CreateIndex
CREATE INDEX "MaterialDidatico_createdAt_idx" ON "MaterialDidatico"("createdAt");

-- AddForeignKey
ALTER TABLE "AlunoRegistro" ADD CONSTRAINT "AlunoRegistro_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDidatico" ADD CONSTRAINT "MaterialDidatico_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDidatico" ADD CONSTRAINT "MaterialDidatico_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDidatico" ADD CONSTRAINT "MaterialDidatico_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDidatico" ADD CONSTRAINT "MaterialDidatico_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE SET NULL ON UPDATE CASCADE;
