"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { FinancialPageContent } from "@/components/financeiro/financial-page-content";
import { FinancialModals } from "@/components/financeiro/financial-modals";
import { useFinancialPage } from "@/hooks/financeiro/use-financial-page";

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
        onGenerateMonthlyPayments={financialPage.submitGenerateMonthlyPayments}
        onRegisterPayment={financialPage.openRegisterPayment}
        onViewDetails={financialPage.openPaymentDetails}
        onDeletePayment={financialPage.openDeletePayment}
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
      />
    </DashboardLayout>
  );
}