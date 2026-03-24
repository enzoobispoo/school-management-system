"use client";

import { useFinancialActions } from "@/hooks/financeiro/use-financial-actions";
import { useFinancialModals } from "@/hooks/financeiro/use-financial-modals";
import { useFinancialQuery } from "@/hooks/financeiro/use-financial-query";

export function useFinancialPage() {
  const query = useFinancialQuery();
  const actions = useFinancialActions(query.fetchPayments);
  const modals = useFinancialModals();

  async function submitDeletePayment() {
    if (!modals.selectedPaymentToDelete) return;

    try {
      query.setError("");
      await actions.handleDeletePayment(modals.selectedPaymentToDelete.id);
      modals.closeDeletePayment();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao excluir mensalidade";

      query.setError(message);
      throw err;
    }
  }

  async function submitGenerateMonthlyPayments() {
    try {
      query.setError("");
      await actions.handleGenerateMonthlyPayments();
      modals.setGenerateDialogOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao gerar mensalidades";

      query.setError(message);
      throw err;
    }
  }

  async function submitRegisterPayment(
    paymentId: string,
    metodoPagamento: string
  ) {
    try {
      query.setError("");
      await actions.handlePay(paymentId, metodoPagamento);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao registrar pagamento";

      query.setError(message);
      throw err;
    }
  }

  return {
    ...query,
    ...actions,
    ...modals,
    submitDeletePayment,
    submitGenerateMonthlyPayments,
    submitRegisterPayment,
  };
}