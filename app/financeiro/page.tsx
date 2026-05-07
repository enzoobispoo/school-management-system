"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { FinancialPageContent } from "@/components/financeiro/financial-page-content";
import { FinancialModals } from "@/components/financeiro/financial-modals";
import { GenerateBoletoModal } from "@/components/financeiro/modals/generate-boleto-modal";
import { DemonstrativoIrModal } from "@/components/alunos/demonstrativo-ir-modal";
import { useFinancialPage } from "@/hooks/financeiro/use-financial-page";
import type { PaymentTableItem } from "@/hooks/financeiro/use-financial-query";

export default function FinanceiroPage() {
  const financialPage = useFinancialPage();

  return (
    <DashboardLayout>
      <Header
        title="Financeiro"
        description="Controle de receitas e pagamentos"
      />

<FinancialPageContent
  payments={financialPage.payments}
  loading={financialPage.loading}
  loadingTotals={financialPage.loadingTotals}
  error={financialPage.error}
  page={financialPage.page}
  setPage={financialPage.setPage}
  meta={financialPage.meta}
  tabStatus={financialPage.tabStatus}
  setTabStatus={financialPage.setTabStatus}
  search={financialPage.search}
  setSearch={financialPage.setSearch}
  month={financialPage.month}
  setMonth={financialPage.setMonth}
  generateDialogOpen={financialPage.generateDialogOpen}
  setGenerateDialogOpen={financialPage.setGenerateDialogOpen}
  generatingMonthlyPayments={financialPage.generatingMonthlyPayments}
  actionLoadingId={financialPage.actionLoadingId}
  financialTotals={financialPage.financialTotals}
  advancedMetrics={financialPage.advancedMetrics}
  onGenerateMonthlyPayments={financialPage.submitGenerateMonthlyPayments}
  onRegisterPayment={financialPage.openRegisterPayment}
  onSendReminder={financialPage.sendReminder}
  onViewDetails={financialPage.openPaymentDetails}
  onDeletePayment={financialPage.openDeletePayment}
  onGenerateBoleto={financialPage.generateBoleto}
  onPrintReceipt={financialPage.openReceipt}
  onDemonstrativoIr={financialPage.openDemonstrativoIr}
/>

      <FinancialModals
        paymentConfirmOpen={financialPage.paymentConfirmOpen}
        onClosePaymentConfirm={financialPage.closeRegisterPayment}
        selectedPayment={financialPage.selectedPayment}
        detailsOpen={financialPage.detailsOpen}
        onCloseDetails={financialPage.closePaymentDetails}
        selectedPaymentDetails={financialPage.selectedPaymentDetails}
        deleteOpen={financialPage.deleteOpen}
        onCloseDelete={financialPage.closeDeletePayment}
        selectedPaymentToDelete={financialPage.selectedPaymentToDelete}
        actionLoadingId={financialPage.actionLoadingId}
        onConfirmPayment={financialPage.submitRegisterPayment}
        onConfirmDelete={financialPage.submitDeletePayment}
        receiptOpen={financialPage.receiptOpen}
        onCloseReceipt={financialPage.closeReceipt}
        selectedPaymentForReceipt={financialPage.selectedPaymentForReceipt}
      />

      {financialPage.demonstrativoIrTarget ? (
        <DemonstrativoIrModal
          open
          onOpenChange={(next) => {
            if (!next) financialPage.closeDemonstrativoIr();
          }}
          alunoId={financialPage.demonstrativoIrTarget.alunoId}
          alunoNome={financialPage.demonstrativoIrTarget.studentName}
          initialSelectedYears={financialPage.demonstrativoIrTarget.defaultYears}
        />
      ) : null}

      <GenerateBoletoModal
        open={financialPage.generateBoletoOpen}
        onOpenChange={(open) => {
          financialPage.setGenerateBoletoOpen(open);
          if (!open) {
            financialPage.closeGenerateBoleto();
          }
        }}
        initialPayment={financialPage.selectedPaymentForBoleto}
        payments={financialPage.payments
          .filter(
            (p: PaymentTableItem) =>
              p.student === financialPage.selectedPaymentForBoleto?.student &&
              p.status !== "paid"
          )
          .map((p: PaymentTableItem) => ({
            id: p.id,
            student: p.student,
            description: p.description,
            amount: p.amount,
            competence: p.competence,
            dueDate: p.dueDate,
            status: p.status,
          }))}
        generating={financialPage.actionLoadingId === "batch-boleto"}
        onGenerate={async (paymentIds, method) => {
          await financialPage.handleGenerateBoleto(paymentIds, method);
          financialPage.closeGenerateBoleto();
        }}
      />
    </DashboardLayout>
  );
}