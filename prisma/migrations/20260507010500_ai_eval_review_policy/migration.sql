-- AlterTable
ALTER TABLE "EscolaSettings"
ADD COLUMN "aiEvalReviewEnforced" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "aiEvalReviewMinScore" INTEGER NOT NULL DEFAULT 70;
