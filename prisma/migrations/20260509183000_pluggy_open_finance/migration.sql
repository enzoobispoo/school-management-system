-- Migra de stub Open Finance para integração Pluggy (produção).
DROP TABLE IF EXISTS "SchoolOpenFinanceConnection";
DROP TYPE IF EXISTS "OpenFinanceConnectionStatus";

CREATE TYPE "PluggyConnectionStatus" AS ENUM ('DISCONNECTED', 'ACTIVE', 'ERROR');

CREATE TABLE "SchoolPluggyConnection" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "pluggyItemId" TEXT NOT NULL,
    "connectorId" INTEGER,
    "institutionName" TEXT,
    "institutionUrl" TEXT,
    "status" "PluggyConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "pluggyItemStatus" TEXT,
    "lastPluggyItemUpdateAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncError" VARCHAR(4000),
    "encryptedCredentialEnvelope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolPluggyConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SchoolPluggyConnection_schoolId_key" ON "SchoolPluggyConnection"("schoolId");
CREATE UNIQUE INDEX "SchoolPluggyConnection_pluggyItemId_key" ON "SchoolPluggyConnection"("pluggyItemId");
CREATE INDEX "SchoolPluggyConnection_schoolId_idx" ON "SchoolPluggyConnection"("schoolId");
CREATE INDEX "SchoolPluggyConnection_pluggyItemId_idx" ON "SchoolPluggyConnection"("pluggyItemId");
CREATE INDEX "SchoolPluggyConnection_status_idx" ON "SchoolPluggyConnection"("status");

ALTER TABLE "SchoolPluggyConnection" ADD CONSTRAINT "SchoolPluggyConnection_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PluggyAccount" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "pluggyAccountId" TEXT NOT NULL,
    "pluggyItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subtype" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "balance" DECIMAL(18,2) NOT NULL,
    "bankClosingBalance" DECIMAL(18,2),
    "numberMasked" TEXT,
    "ownerName" TEXT,
    "updatedAtPluggy" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PluggyAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PluggyAccount_schoolId_pluggyAccountId_key" ON "PluggyAccount"("schoolId", "pluggyAccountId");
CREATE INDEX "PluggyAccount_schoolId_idx" ON "PluggyAccount"("schoolId");
CREATE INDEX "PluggyAccount_connectionId_idx" ON "PluggyAccount"("connectionId");

ALTER TABLE "PluggyAccount" ADD CONSTRAINT "PluggyAccount_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "SchoolPluggyConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PluggyTransaction" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "pluggyTransactionId" TEXT NOT NULL,
    "pluggyAccountId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "descriptionRaw" VARCHAR(4000),
    "status" TEXT,
    "category" TEXT,
    "paymentData" JSONB,
    "reconciledPagamentoId" TEXT,
    "reconciledAt" TIMESTAMP(3),
    "reconciliationConfidence" DECIMAL(7,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PluggyTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PluggyTransaction_schoolId_pluggyTransactionId_key" ON "PluggyTransaction"("schoolId", "pluggyTransactionId");
CREATE INDEX "PluggyTransaction_schoolId_date_idx" ON "PluggyTransaction"("schoolId", "date");
CREATE INDEX "PluggyTransaction_connectionId_idx" ON "PluggyTransaction"("connectionId");
CREATE INDEX "PluggyTransaction_accountId_idx" ON "PluggyTransaction"("accountId");
CREATE INDEX "PluggyTransaction_reconciledPagamentoId_idx" ON "PluggyTransaction"("reconciledPagamentoId");

ALTER TABLE "PluggyTransaction" ADD CONSTRAINT "PluggyTransaction_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "SchoolPluggyConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PluggyTransaction" ADD CONSTRAINT "PluggyTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PluggyAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PluggyTransaction" ADD CONSTRAINT "PluggyTransaction_reconciledPagamentoId_fkey" FOREIGN KEY ("reconciledPagamentoId") REFERENCES "Pagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "PluggySyncLog" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "detail" VARCHAR(4000),
    "accountsUpserted" INTEGER NOT NULL DEFAULT 0,
    "transactionsUpserted" INTEGER NOT NULL DEFAULT 0,
    "reconciliationsApplied" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "PluggySyncLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PluggySyncLog_schoolId_startedAt_idx" ON "PluggySyncLog"("schoolId", "startedAt");
CREATE INDEX "PluggySyncLog_connectionId_idx" ON "PluggySyncLog"("connectionId");

ALTER TABLE "PluggySyncLog" ADD CONSTRAINT "PluggySyncLog_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "SchoolPluggyConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
