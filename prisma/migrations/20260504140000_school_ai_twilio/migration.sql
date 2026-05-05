-- Per-school OpenAI, usage counters, and optional Twilio (plano full)
ALTER TABLE "EscolaSettings" ADD COLUMN "openaiApiKey" TEXT;
ALTER TABLE "EscolaSettings" ADD COLUMN "aiMonthlyLimitOverride" INTEGER;
ALTER TABLE "EscolaSettings" ADD COLUMN "aiUsageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EscolaSettings" ADD COLUMN "aiUsageResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "EscolaSettings" ADD COLUMN "twilioAccountSid" TEXT;
ALTER TABLE "EscolaSettings" ADD COLUMN "twilioAuthToken" TEXT;
ALTER TABLE "EscolaSettings" ADD COLUMN "twilioWhatsAppFrom" TEXT;
