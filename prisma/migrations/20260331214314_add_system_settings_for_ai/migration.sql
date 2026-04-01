-- CreateEnum
CREATE TYPE "AiProviderMode" AS ENUM ('PLATFORM', 'CUSTOM');

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "aiProviderMode" "AiProviderMode" NOT NULL DEFAULT 'PLATFORM',
    "openaiApiKey" TEXT,
    "aiMonthlyLimit" INTEGER NOT NULL DEFAULT 1000,
    "aiUsageCount" INTEGER NOT NULL DEFAULT 0,
    "aiUsageResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);
