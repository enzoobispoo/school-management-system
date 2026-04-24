-- AlterTable
ALTER TABLE "EscolaSettings" ADD COLUMN     "asaasApiKey" TEXT,
ADD COLUMN     "asaasEnvironment" TEXT DEFAULT 'sandbox',
ADD COLUMN     "asaasWalletId" TEXT,
ADD COLUMN     "autoGenerateBoleto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "billingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "billingProvider" TEXT DEFAULT 'asaas',
ADD COLUMN     "defaultChargeMethod" TEXT DEFAULT 'boleto';
