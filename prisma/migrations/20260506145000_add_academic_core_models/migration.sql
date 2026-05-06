CREATE TABLE "Disciplina" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "codigo" TEXT,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Disciplina_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TurmaDisciplina" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "turmaId" TEXT NOT NULL,
  "disciplinaId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TurmaDisciplina_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Avaliacao" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "turmaId" TEXT NOT NULL,
  "disciplinaId" TEXT NOT NULL,
  "professorId" TEXT,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT,
  "peso" DECIMAL(5,2),
  "dataAvaliacao" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotaAvaliacao" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "avaliacaoId" TEXT NOT NULL,
  "matriculaId" TEXT NOT NULL,
  "nota" DECIMAL(5,2) NOT NULL,
  "observacao" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotaAvaliacao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AulaRegistro" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "turmaId" TEXT NOT NULL,
  "disciplinaId" TEXT NOT NULL,
  "titulo" TEXT,
  "conteudo" TEXT,
  "dataAula" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AulaRegistro_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PresencaAula" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "aulaId" TEXT NOT NULL,
  "matriculaId" TEXT NOT NULL,
  "presente" BOOLEAN NOT NULL DEFAULT true,
  "observacao" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PresencaAula_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Disciplina_schoolId_nome_key" ON "Disciplina"("schoolId", "nome");
CREATE UNIQUE INDEX "TurmaDisciplina_turmaId_disciplinaId_key" ON "TurmaDisciplina"("turmaId", "disciplinaId");
CREATE UNIQUE INDEX "NotaAvaliacao_avaliacaoId_matriculaId_key" ON "NotaAvaliacao"("avaliacaoId", "matriculaId");
CREATE UNIQUE INDEX "PresencaAula_aulaId_matriculaId_key" ON "PresencaAula"("aulaId", "matriculaId");

CREATE INDEX "Disciplina_schoolId_idx" ON "Disciplina"("schoolId");
CREATE INDEX "Disciplina_ativo_idx" ON "Disciplina"("ativo");
CREATE INDEX "TurmaDisciplina_schoolId_idx" ON "TurmaDisciplina"("schoolId");
CREATE INDEX "TurmaDisciplina_turmaId_idx" ON "TurmaDisciplina"("turmaId");
CREATE INDEX "TurmaDisciplina_disciplinaId_idx" ON "TurmaDisciplina"("disciplinaId");
CREATE INDEX "Avaliacao_schoolId_idx" ON "Avaliacao"("schoolId");
CREATE INDEX "Avaliacao_turmaId_idx" ON "Avaliacao"("turmaId");
CREATE INDEX "Avaliacao_disciplinaId_idx" ON "Avaliacao"("disciplinaId");
CREATE INDEX "Avaliacao_dataAvaliacao_idx" ON "Avaliacao"("dataAvaliacao");
CREATE INDEX "NotaAvaliacao_schoolId_idx" ON "NotaAvaliacao"("schoolId");
CREATE INDEX "NotaAvaliacao_matriculaId_idx" ON "NotaAvaliacao"("matriculaId");
CREATE INDEX "AulaRegistro_schoolId_idx" ON "AulaRegistro"("schoolId");
CREATE INDEX "AulaRegistro_turmaId_idx" ON "AulaRegistro"("turmaId");
CREATE INDEX "AulaRegistro_disciplinaId_idx" ON "AulaRegistro"("disciplinaId");
CREATE INDEX "AulaRegistro_dataAula_idx" ON "AulaRegistro"("dataAula");
CREATE INDEX "PresencaAula_schoolId_idx" ON "PresencaAula"("schoolId");
CREATE INDEX "PresencaAula_matriculaId_idx" ON "PresencaAula"("matriculaId");

ALTER TABLE "Disciplina" ADD CONSTRAINT "Disciplina_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TurmaDisciplina" ADD CONSTRAINT "TurmaDisciplina_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TurmaDisciplina" ADD CONSTRAINT "TurmaDisciplina_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TurmaDisciplina" ADD CONSTRAINT "TurmaDisciplina_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NotaAvaliacao" ADD CONSTRAINT "NotaAvaliacao_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotaAvaliacao" ADD CONSTRAINT "NotaAvaliacao_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "Avaliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotaAvaliacao" ADD CONSTRAINT "NotaAvaliacao_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AulaRegistro" ADD CONSTRAINT "AulaRegistro_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AulaRegistro" ADD CONSTRAINT "AulaRegistro_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AulaRegistro" ADD CONSTRAINT "AulaRegistro_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PresencaAula" ADD CONSTRAINT "PresencaAula_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PresencaAula" ADD CONSTRAINT "PresencaAula_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "AulaRegistro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PresencaAula" ADD CONSTRAINT "PresencaAula_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

