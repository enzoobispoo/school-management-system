/*
  Warnings:

  - You are about to drop the `SchoolSetting` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "densidade" TEXT DEFAULT 'comfortable',
ADD COLUMN     "telefone" TEXT,
ADD COLUMN     "temaPreferido" TEXT DEFAULT 'light';

-- DropTable
DROP TABLE "SchoolSetting";

-- CreateTable
CREATE TABLE "EscolaSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "nomeEscola" TEXT NOT NULL,
    "cnpj" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "whatsapp" TEXT,
    "endereco" TEXT,
    "logoUrl" TEXT,
    "corPrimaria" TEXT DEFAULT '#111111',
    "diaVencimentoPadrao" INTEGER DEFAULT 10,
    "multaAtrasoPercentual" DECIMAL(10,2),
    "jurosMensalPercentual" DECIMAL(10,2),
    "gerarMensalidadeAuto" BOOLEAN NOT NULL DEFAULT false,
    "metodoPagamentoPadrao" TEXT,
    "notificarNovoAluno" BOOLEAN NOT NULL DEFAULT true,
    "notificarPagamento" BOOLEAN NOT NULL DEFAULT true,
    "notificarAtraso" BOOLEAN NOT NULL DEFAULT true,
    "enviarLembreteAuto" BOOLEAN NOT NULL DEFAULT false,
    "temaPadrao" TEXT DEFAULT 'light',
    "densidade" TEXT DEFAULT 'comfortable',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscolaSettings_pkey" PRIMARY KEY ("id")
);
