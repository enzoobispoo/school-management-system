-- Financeiro profissional: contratos por matrícula, contas a pagar, negociações,
-- perfil/pagamentos de professores, documentos fiscais internos (NFS-e/NF-e via provider futuro).

CREATE TYPE "StatusContaPagar" AS ENUM ('PENDENTE', 'PAGO', 'CANCELADO');

CREATE TYPE "ProfessorRegimeTrabalho" AS ENUM ('CLT', 'PJ', 'AUTONOMO', 'ESTAGIO', 'OUTRO');

CREATE TYPE "ProfessorSituacaoFinanceira" AS ENUM ('REGULAR', 'PENDENCIA_DOCUMENTACAO', 'INATIVO');

CREATE TYPE "StatusProfessorPagamento" AS ENUM ('RASCUNHO', 'APROVADO', 'PAGO', 'CANCELADO');

CREATE TYPE "SchoolInvoiceStatus" AS ENUM ('RASCUNHO', 'EMITIDA', 'CANCELADA');

CREATE TYPE "SchoolInvoiceTipo" AS ENUM ('COBRANCA_ALUNO', 'SERVICO_PROFESSOR', 'OUTRO');

CREATE TABLE "MatriculaContratoFinanceiro" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "matriculaId" TEXT NOT NULL,
    "valorMensalidadeBase" DECIMAL(10,2),
    "descontoPercentual" DECIMAL(5,2),
    "bolsaValor" DECIMAL(10,2),
    "dataInicioContrato" TIMESTAMP(3),
    "dataFimContrato" TIMESTAMP(3),
    "reajusteAnualPercentual" DECIMAL(5,2),
    "observacoes" VARCHAR(8000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatriculaContratoFinanceiro_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MatriculaContratoFinanceiro_matriculaId_key" ON "MatriculaContratoFinanceiro"("matriculaId");

CREATE INDEX "MatriculaContratoFinanceiro_schoolId_idx" ON "MatriculaContratoFinanceiro"("schoolId");

ALTER TABLE "MatriculaContratoFinanceiro" ADD CONSTRAINT "MatriculaContratoFinanceiro_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MatriculaContratoFinanceiro" ADD CONSTRAINT "MatriculaContratoFinanceiro_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ContaPagar" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "fornecedorNome" VARCHAR(500) NOT NULL,
    "descricao" VARCHAR(2000) NOT NULL,
    "categoria" VARCHAR(120),
    "valor" DECIMAL(12,2) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "status" "StatusContaPagar" NOT NULL DEFAULT 'PENDENTE',
    "observacoes" VARCHAR(4000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContaPagar_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContaPagar_schoolId_idx" ON "ContaPagar"("schoolId");

CREATE INDEX "ContaPagar_schoolId_status_idx" ON "ContaPagar"("schoolId", "status");

CREATE INDEX "ContaPagar_vencimento_idx" ON "ContaPagar"("vencimento");

ALTER TABLE "ContaPagar" ADD CONSTRAINT "ContaPagar_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "NegociacaoMensalidade" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "matriculaId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "valorProposto" DECIMAL(10,2),
    "parcelasPropostas" INTEGER,
    "observacoes" VARCHAR(4000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NegociacaoMensalidade_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NegociacaoMensalidade_schoolId_idx" ON "NegociacaoMensalidade"("schoolId");

CREATE INDEX "NegociacaoMensalidade_matriculaId_idx" ON "NegociacaoMensalidade"("matriculaId");

ALTER TABLE "NegociacaoMensalidade" ADD CONSTRAINT "NegociacaoMensalidade_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NegociacaoMensalidade" ADD CONSTRAINT "NegociacaoMensalidade_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProfessorPerfilFinanceiro" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "regime" "ProfessorRegimeTrabalho" NOT NULL DEFAULT 'CLT',
    "situacao" "ProfessorSituacaoFinanceira" NOT NULL DEFAULT 'REGULAR',
    "documento" VARCHAR(20),
    "chavePix" VARCHAR(200),
    "dadosBancarios" JSONB,
    "valorReferenciaMensal" DECIMAL(12,2),
    "dataAdmissao" TIMESTAMP(3),
    "observacoes" VARCHAR(4000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessorPerfilFinanceiro_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProfessorPerfilFinanceiro_professorId_key" ON "ProfessorPerfilFinanceiro"("professorId");

CREATE INDEX "ProfessorPerfilFinanceiro_schoolId_idx" ON "ProfessorPerfilFinanceiro"("schoolId");

ALTER TABLE "ProfessorPerfilFinanceiro" ADD CONSTRAINT "ProfessorPerfilFinanceiro_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfessorPerfilFinanceiro" ADD CONSTRAINT "ProfessorPerfilFinanceiro_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProfessorPagamento" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "competenciaMes" INTEGER NOT NULL,
    "competenciaAno" INTEGER NOT NULL,
    "valorBruto" DECIMAL(12,2) NOT NULL,
    "descontos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valorLiquido" DECIMAL(12,2) NOT NULL,
    "status" "StatusProfessorPagamento" NOT NULL DEFAULT 'RASCUNHO',
    "dataPagamento" TIMESTAMP(3),
    "descricao" VARCHAR(500),
    "observacoes" VARCHAR(4000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessorPagamento_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProfessorPagamento_professorId_competenciaMes_competenciaAno_key" ON "ProfessorPagamento"("professorId", "competenciaMes", "competenciaAno");

CREATE INDEX "ProfessorPagamento_schoolId_idx" ON "ProfessorPagamento"("schoolId");

CREATE INDEX "ProfessorPagamento_professorId_idx" ON "ProfessorPagamento"("professorId");

ALTER TABLE "ProfessorPagamento" ADD CONSTRAINT "ProfessorPagamento_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfessorPagamento" ADD CONSTRAINT "ProfessorPagamento_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SchoolInvoice" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sequencial" INTEGER NOT NULL,
    "tipo" "SchoolInvoiceTipo" NOT NULL DEFAULT 'OUTRO',
    "status" "SchoolInvoiceStatus" NOT NULL DEFAULT 'RASCUNHO',
    "tomadorNome" VARCHAR(500) NOT NULL,
    "tomadorDocumento" VARCHAR(20),
    "tomadorEmail" VARCHAR(255),
    "dataEmissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataVencimento" TIMESTAMP(3),
    "subtotal" DECIMAL(14,2) NOT NULL,
    "descontoTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL,
    "observacoes" VARCHAR(4000),
    "matriculaId" TEXT,
    "professorId" TEXT,
    "providerFiscal" VARCHAR(80),
    "idExternoFiscal" VARCHAR(120),
    "pdfUrl" VARCHAR(2000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolInvoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SchoolInvoice_schoolId_sequencial_key" ON "SchoolInvoice"("schoolId", "sequencial");

CREATE INDEX "SchoolInvoice_schoolId_idx" ON "SchoolInvoice"("schoolId");

CREATE INDEX "SchoolInvoice_schoolId_status_idx" ON "SchoolInvoice"("schoolId", "status");

ALTER TABLE "SchoolInvoice" ADD CONSTRAINT "SchoolInvoice_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SchoolInvoice" ADD CONSTRAINT "SchoolInvoice_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SchoolInvoice" ADD CONSTRAINT "SchoolInvoice_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "SchoolInvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "descricao" VARCHAR(500) NOT NULL,
    "quantidade" DECIMAL(12,4) NOT NULL,
    "valorUnitario" DECIMAL(12,2) NOT NULL,
    "desconto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SchoolInvoiceLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SchoolInvoiceLine_invoiceId_idx" ON "SchoolInvoiceLine"("invoiceId");

ALTER TABLE "SchoolInvoiceLine" ADD CONSTRAINT "SchoolInvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SchoolInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
