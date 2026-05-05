-- CreateTable School
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT,
    "plano" TEXT NOT NULL DEFAULT 'starter',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "School_slug_key" ON "School"("slug");
CREATE INDEX "School_slug_idx" ON "School"("slug");
CREATE INDEX "School_ativo_idx" ON "School"("ativo");

-- Migrate existing data: create a default school from EscolaSettings
INSERT INTO "School" ("id", "nome", "slug", "createdAt", "updatedAt")
SELECT 'default_school', COALESCE("nomeEscola", 'Escola'), 'escola-principal', NOW(), NOW()
FROM "EscolaSettings" WHERE "id" = 'default'
ON CONFLICT DO NOTHING;

-- If no EscolaSettings exists, insert a fallback school
INSERT INTO "School" ("id", "nome", "slug", "createdAt", "updatedAt")
VALUES ('default_school', 'Escola', 'escola-principal', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Add schoolId to User (nullable for SUPER_ADMIN)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
UPDATE "User" SET "schoolId" = 'default_school' WHERE "role" != 'SUPER_ADMIN';
CREATE INDEX IF NOT EXISTS "User_schoolId_idx" ON "User"("schoolId");

-- Add schoolId to Aluno
ALTER TABLE "Aluno" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
UPDATE "Aluno" SET "schoolId" = 'default_school';
ALTER TABLE "Aluno" ALTER COLUMN "schoolId" SET NOT NULL;
-- Drop old unique constraints and add school-scoped ones
ALTER TABLE "Aluno" DROP CONSTRAINT IF EXISTS "Aluno_email_key";
ALTER TABLE "Aluno" DROP CONSTRAINT IF EXISTS "Aluno_cpf_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Aluno_schoolId_email_key" ON "Aluno"("schoolId", "email") WHERE "email" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Aluno_schoolId_cpf_key" ON "Aluno"("schoolId", "cpf") WHERE "cpf" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Aluno_schoolId_idx" ON "Aluno"("schoolId");

-- Add schoolId to Curso
ALTER TABLE "Curso" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
UPDATE "Curso" SET "schoolId" = 'default_school';
ALTER TABLE "Curso" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "Curso" DROP CONSTRAINT IF EXISTS "Curso_nome_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Curso_schoolId_nome_key" ON "Curso"("schoolId", "nome");
CREATE INDEX IF NOT EXISTS "Curso_schoolId_idx" ON "Curso"("schoolId");

-- Add schoolId to Professor
ALTER TABLE "Professor" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
UPDATE "Professor" SET "schoolId" = 'default_school';
ALTER TABLE "Professor" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "Professor" DROP CONSTRAINT IF EXISTS "Professor_email_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Professor_schoolId_email_key" ON "Professor"("schoolId", "email") WHERE "email" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Professor_schoolId_idx" ON "Professor"("schoolId");

-- Add schoolId to Turma
ALTER TABLE "Turma" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
UPDATE "Turma" SET "schoolId" = 'default_school';
ALTER TABLE "Turma" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "Turma" DROP CONSTRAINT IF EXISTS "Turma_cursoId_nome_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Turma_schoolId_cursoId_nome_key" ON "Turma"("schoolId", "cursoId", "nome");
CREATE INDEX IF NOT EXISTS "Turma_schoolId_idx" ON "Turma"("schoolId");

-- Add schoolId to Matricula
ALTER TABLE "Matricula" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
UPDATE "Matricula" SET "schoolId" = 'default_school';
ALTER TABLE "Matricula" ALTER COLUMN "schoolId" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "Matricula_schoolId_idx" ON "Matricula"("schoolId");

-- Add schoolId to Pagamento
ALTER TABLE "Pagamento" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
UPDATE "Pagamento" SET "schoolId" = 'default_school';
ALTER TABLE "Pagamento" ALTER COLUMN "schoolId" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "Pagamento_schoolId_idx" ON "Pagamento"("schoolId");

-- Add schoolId to Evento
ALTER TABLE "Evento" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
UPDATE "Evento" SET "schoolId" = 'default_school';
ALTER TABLE "Evento" ALTER COLUMN "schoolId" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "Evento_schoolId_idx" ON "Evento"("schoolId");

-- Add schoolId to Notificacao
ALTER TABLE "Notificacao" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
UPDATE "Notificacao" SET "schoolId" = 'default_school';
ALTER TABLE "Notificacao" ALTER COLUMN "schoolId" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "Notificacao_schoolId_idx" ON "Notificacao"("schoolId");

-- Add schoolId to UserInvite
ALTER TABLE "UserInvite" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
UPDATE "UserInvite" SET "schoolId" = 'default_school';
CREATE INDEX IF NOT EXISTS "UserInvite_schoolId_idx" ON "UserInvite"("schoolId");

-- Migrate EscolaSettings: add schoolId column
ALTER TABLE "EscolaSettings" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
UPDATE "EscolaSettings" SET "schoolId" = 'default_school' WHERE "id" = 'default';
CREATE UNIQUE INDEX IF NOT EXISTS "EscolaSettings_schoolId_key" ON "EscolaSettings"("schoolId");

-- Add FK constraints
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Professor" ADD CONSTRAINT "Professor_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserInvite" ADD CONSTRAINT "UserInvite_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "EscolaSettings" ADD CONSTRAINT "EscolaSettings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
