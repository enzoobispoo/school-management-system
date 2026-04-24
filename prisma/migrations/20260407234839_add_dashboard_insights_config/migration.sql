-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dashboardInsightsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dashboardInsightsLimit" INTEGER NOT NULL DEFAULT 3;
