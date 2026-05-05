-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ATIVA', 'CANCELADA', 'SUSPENSA', 'TRIAL');

-- CreateTable Plan
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "descricao" TEXT,
    "limiteAlunos" INTEGER,
    "limiteTurmas" INTEGER,
    "limiteUsuarios" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Plan_nome_key" ON "Plan"("nome");
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");
CREATE INDEX "Plan_slug_idx" ON "Plan"("slug");
CREATE INDEX "Plan_ativo_idx" ON "Plan"("ativo");

-- CreateTable SchoolSubscription
CREATE TABLE "SchoolSubscription" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ATIVA',
    "valorPago" DECIMAL(10,2) NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SchoolSubscription_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SchoolSubscription_schoolId_idx" ON "SchoolSubscription"("schoolId");
CREATE INDEX "SchoolSubscription_planId_idx" ON "SchoolSubscription"("planId");
CREATE INDEX "SchoolSubscription_status_idx" ON "SchoolSubscription"("status");
CREATE INDEX "SchoolSubscription_dataInicio_idx" ON "SchoolSubscription"("dataInicio");

-- AddForeignKey
ALTER TABLE "SchoolSubscription" ADD CONSTRAINT "SchoolSubscription_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchoolSubscription" ADD CONSTRAINT "SchoolSubscription_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON UPDATE CASCADE;

-- Seed default plans
INSERT INTO "Plan" ("id", "nome", "slug", "preco", "descricao", "limiteAlunos", "limiteTurmas", "limiteUsuarios", "updatedAt")
VALUES
  ('plan_starter',  'Starter',      'starter',      97.00,  'Ideal para escolas pequenas',    50,  5,  3,  NOW()),
  ('plan_pro',      'Pro',          'pro',          197.00, 'Para escolas em crescimento',    200, 20, 10, NOW()),
  ('plan_premium',  'Premium',      'premium',      397.00, 'Sem limites operacionais',       NULL, NULL, NULL, NOW());
