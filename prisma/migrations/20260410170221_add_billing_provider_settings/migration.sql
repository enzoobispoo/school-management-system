-- AlterTable
ALTER TABLE "Pagamento" ADD COLUMN     "billingBankSlipUrl" TEXT,
ADD COLUMN     "billingExternalId" TEXT,
ADD COLUMN     "billingInvoiceUrl" TEXT,
ADD COLUMN     "billingProvider" TEXT,
ADD COLUMN     "billingStatus" TEXT,
ADD COLUMN     "boletoGeradoEm" TIMESTAMP(3);
