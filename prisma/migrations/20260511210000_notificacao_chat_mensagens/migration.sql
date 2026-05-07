-- AlterEnum
ALTER TYPE "TipoNotificacao" ADD VALUE 'NOVA_MENSAGEM_CHAT';

-- AlterEnum
ALTER TYPE "EntidadeNotificacao" ADD VALUE 'CHAT_THREAD';

-- AlterTable
ALTER TABLE "Notificacao" ADD COLUMN "destinatarioUserId" TEXT;

-- CreateIndex
CREATE INDEX "Notificacao_destinatarioUserId_idx" ON "Notificacao"("destinatarioUserId");

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_destinatarioUserId_fkey" FOREIGN KEY ("destinatarioUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
