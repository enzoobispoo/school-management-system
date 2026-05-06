CREATE TYPE "TipoAlunoRegistro" AS ENUM ('OCORRENCIA', 'ADVERTENCIA', 'OBSERVACAO');

CREATE TABLE "AlunoRegistro" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "alunoId" TEXT NOT NULL,
  "tipo" "TipoAlunoRegistro" NOT NULL,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT,
  "gravidade" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AlunoRegistro_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AlunoRegistro_schoolId_idx" ON "AlunoRegistro"("schoolId");
CREATE INDEX "AlunoRegistro_alunoId_idx" ON "AlunoRegistro"("alunoId");
CREATE INDEX "AlunoRegistro_tipo_idx" ON "AlunoRegistro"("tipo");
CREATE INDEX "AlunoRegistro_createdAt_idx" ON "AlunoRegistro"("createdAt");

ALTER TABLE "AlunoRegistro"
ADD CONSTRAINT "AlunoRegistro_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AlunoRegistro"
ADD CONSTRAINT "AlunoRegistro_alunoId_fkey"
FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

