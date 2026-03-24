-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('GERAL', 'REUNIAO', 'PROVA', 'REPOSICAO', 'FERIADO', 'LEMBRETE');

-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoEvento" NOT NULL DEFAULT 'GERAL',
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "diaInteiro" BOOLEAN NOT NULL DEFAULT false,
    "cor" TEXT,
    "local" TEXT,
    "professorId" TEXT,
    "turmaId" TEXT,
    "cursoId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Evento_tipo_idx" ON "Evento"("tipo");

-- CreateIndex
CREATE INDEX "Evento_ativo_idx" ON "Evento"("ativo");

-- CreateIndex
CREATE INDEX "Evento_dataInicio_idx" ON "Evento"("dataInicio");

-- CreateIndex
CREATE INDEX "Evento_dataFim_idx" ON "Evento"("dataFim");

-- CreateIndex
CREATE INDEX "Evento_professorId_idx" ON "Evento"("professorId");

-- CreateIndex
CREATE INDEX "Evento_turmaId_idx" ON "Evento"("turmaId");

-- CreateIndex
CREATE INDEX "Evento_cursoId_idx" ON "Evento"("cursoId");

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;
