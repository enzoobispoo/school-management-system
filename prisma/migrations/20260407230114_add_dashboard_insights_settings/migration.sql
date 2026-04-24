-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dashboardInsightsDismissed" JSONB,
ADD COLUMN     "dashboardInsightsFrequency" TEXT DEFAULT 'weekly';
