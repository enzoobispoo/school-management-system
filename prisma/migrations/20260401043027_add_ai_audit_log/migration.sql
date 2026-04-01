-- CreateTable
CREATE TABLE "AiAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiAuditLog_userId_idx" ON "AiAuditLog"("userId");

-- CreateIndex
CREATE INDEX "AiAuditLog_intent_idx" ON "AiAuditLog"("intent");

-- CreateIndex
CREATE INDEX "AiAuditLog_createdAt_idx" ON "AiAuditLog"("createdAt");
