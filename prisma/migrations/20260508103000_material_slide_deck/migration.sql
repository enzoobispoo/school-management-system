-- AlterTable: permite materiais só com deck nativo (sem arquivo Blob).
ALTER TABLE "MaterialDidatico" ALTER COLUMN "arquivoUrl" DROP NOT NULL;
ALTER TABLE "MaterialDidatico" ALTER COLUMN "arquivoNome" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MaterialDidatico" ADD COLUMN "slideDeckJson" JSONB;
