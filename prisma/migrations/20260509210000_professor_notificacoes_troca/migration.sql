-- CreateEnum
CREATE TYPE "TrocaProfessorPropostaStatus" AS ENUM ('PENDENTE', 'ACEITA', 'RECUSADA', 'CANCELADA');

-- AlterEnum
ALTER TYPE "TipoNotificacao" ADD VALUE 'TROCA_PROFESSOR_SOLICITADA';

-- AlterTable
ALTER TABLE "Notificacao" ADD COLUMN "destinatarioProfessorId" TEXT;

-- CreateTable
CREATE TABLE "TrocaProfessorProposta" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "professorAnteriorId" TEXT NOT NULL,
    "professorAlvoId" TEXT NOT NULL,
    "motivoTroca" TEXT,
    "observacoes" TEXT,
    "dataInicioPrevista" TIMESTAMP(3) NOT NULL,
    "resumoTurma" TEXT,
    "resumoHorarios" TEXT,
    "status" "TrocaProfessorPropostaStatus" NOT NULL DEFAULT 'PENDENTE',
    "respondidoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrocaProfessorProposta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notificacao_destinatarioProfessorId_idx" ON "Notificacao"("destinatarioProfessorId");

-- CreateIndex
CREATE INDEX "TrocaProfessorProposta_schoolId_idx" ON "TrocaProfessorProposta"("schoolId");

-- CreateIndex
CREATE INDEX "TrocaProfessorProposta_turmaId_idx" ON "TrocaProfessorProposta"("turmaId");

-- CreateIndex
CREATE INDEX "TrocaProfessorProposta_professorAlvoId_status_idx" ON "TrocaProfessorProposta"("professorAlvoId", "status");

-- CreateIndex
CREATE INDEX "TrocaProfessorProposta_status_idx" ON "TrocaProfessorProposta"("status");

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_destinatarioProfessorId_fkey" FOREIGN KEY ("destinatarioProfessorId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrocaProfessorProposta" ADD CONSTRAINT "TrocaProfessorProposta_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrocaProfessorProposta" ADD CONSTRAINT "TrocaProfessorProposta_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrocaProfessorProposta" ADD CONSTRAINT "TrocaProfessorProposta_professorAnteriorId_fkey" FOREIGN KEY ("professorAnteriorId") REFERENCES "Professor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrocaProfessorProposta" ADD CONSTRAINT "TrocaProfessorProposta_professorAlvoId_fkey" FOREIGN KEY ("professorAlvoId") REFERENCES "Professor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
