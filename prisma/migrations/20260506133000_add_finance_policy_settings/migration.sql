-- Add configurable dunning and suspension policy per school
ALTER TABLE "EscolaSettings"
ADD COLUMN "reguaCobrancaDias" TEXT DEFAULT '1,3,7',
ADD COLUMN "suspenderAposInadimplenciaDias" INTEGER NOT NULL DEFAULT 30;

