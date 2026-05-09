-- Optional API keys for additional AI providers (Anthropic, Google Gemini, Fal.ai / image gen).
ALTER TABLE "EscolaSettings" ADD COLUMN "anthropicApiKey" TEXT;
ALTER TABLE "EscolaSettings" ADD COLUMN "googleGeminiApiKey" TEXT;
ALTER TABLE "EscolaSettings" ADD COLUMN "falAiApiKey" TEXT;
