-- Contas a pagar: NF/anexo fornecedor
ALTER TABLE "ContaPagar" ADD COLUMN "numeroDocumentoFiscal" VARCHAR(80);
ALTER TABLE "ContaPagar" ADD COLUMN "anexoUrl" VARCHAR(2000);

-- Negociação: decisão e rastreio de parcelas geradas
ALTER TABLE "NegociacaoMensalidade" ADD COLUMN "decidedAt" TIMESTAMP(3);
ALTER TABLE "NegociacaoMensalidade" ADD COLUMN "decidedByUserId" TEXT;
ALTER TABLE "NegociacaoMensalidade" ADD COLUMN "decisaoObservacoes" VARCHAR(2000);
ALTER TABLE "NegociacaoMensalidade" ADD COLUMN "parcelasGeradasEm" TIMESTAMP(3);

CREATE INDEX "NegociacaoMensalidade_schoolId_status_idx" ON "NegociacaoMensalidade"("schoolId", "status");

ALTER TABLE "NegociacaoMensalidade" ADD CONSTRAINT "NegociacaoMensalidade_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Professor: campos operacionais CLT (internos)
ALTER TABLE "ProfessorPerfilFinanceiro" ADD COLUMN "cargoFuncao" VARCHAR(200);
ALTER TABLE "ProfessorPerfilFinanceiro" ADD COLUMN "salarioBaseCLT" DECIMAL(12,2);
ALTER TABLE "ProfessorPerfilFinanceiro" ADD COLUMN "valeTransporte" DECIMAL(12,2);
ALTER TABLE "ProfessorPerfilFinanceiro" ADD COLUMN "valeRefeicao" DECIMAL(12,2);

-- Documento fiscal: pedido de emissão (webhook / provedor futuro)
ALTER TABLE "SchoolInvoice" ADD COLUMN "emissionRequestedAt" TIMESTAMP(3);
