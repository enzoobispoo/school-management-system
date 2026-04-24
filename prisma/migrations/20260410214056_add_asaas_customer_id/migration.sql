-- AlterTable
ALTER TABLE "Aluno" ADD COLUMN     "asaasCustomerId" TEXT;

-- AlterTable
ALTER TABLE "Pagamento" ADD COLUMN     "cobrancaLoteId" TEXT;

-- CreateTable
CREATE TABLE "CobrancaLote" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "provider" TEXT,
    "externalId" TEXT,
    "invoiceUrl" TEXT,
    "bankSlipUrl" TEXT,
    "status" TEXT,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CobrancaLote_pkey" PRIMARY KEY ("id")
);
