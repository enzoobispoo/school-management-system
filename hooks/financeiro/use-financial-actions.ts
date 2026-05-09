"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

export function useFinancialActions(onSuccess: () => Promise<void>) {
  const { t } = useDashboardLanguage();
  type ChargeMethod = "boleto" | "pix" | "card";

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [generatingMonthlyPayments, setGeneratingMonthlyPayments] = useState(false);

  async function handleDeletePayment(paymentId: string) {
    try {
      setActionLoadingId(paymentId);
      const response = await fetch(`/api/pagamentos/${paymentId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || t("finance.actions.deletePaymentError"));
        return;
      }
      toast.success(t("finance.actions.deletePaymentSuccess"));
      await onSuccess();
    } finally { setActionLoadingId(null); }
  }

  async function handlePay(id: string, metodoPagamento: string) {
    try {
      setActionLoadingId(id);
      const response = await fetch(`/api/pagamentos/${id}/pagar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metodoPagamento }),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || t("finance.actions.registerPaymentError"));
        return;
      }
      toast.success(t("finance.actions.registerPaymentSuccess"));
      await onSuccess();
    } finally { setActionLoadingId(null); }
  }

  async function handleSendReminder(payment: { id: string; student: string; description: string; amount: number }) {
    try {
      setActionLoadingId(payment.id);
      const response = await fetch("/api/cobrancas/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment.id }),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || t("finance.actions.sendReminderError"));
        return;
      }
      toast.success(t("finance.actions.sendReminderSuccess", { student: payment.student }));
      await onSuccess();
    } finally { setActionLoadingId(null); }
  }

  async function handleGenerateMonthlyPayments() {
    try {
      setGeneratingMonthlyPayments(true);
      const loadingToast = toast.loading(t("finance.actions.generateMonthlyLoading"));
      const response = await fetch("/api/pagamentos/gerar-mensalidades", { method: "POST" });
      const result = await response.json();
      toast.dismiss(loadingToast);
      if (!response.ok) {
        toast.error(result.error || t("finance.actions.generateMonthlyError"));
        return;
      }
      toast.success(
        t("finance.actions.generateMonthlySuccess", {
          count: result.generatedCount ?? 0,
        })
      );
      await onSuccess();
    } finally { setGeneratingMonthlyPayments(false); }
  }

  async function handleGenerateBoleto(
    payment: { id: string; student: string; description: string; amount: number },
    method: ChargeMethod = "boleto"
  ) {
    try {
      setActionLoadingId(payment.id);
      const response = await fetch("/api/cobrancas/gerar-boleto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment.id, method }),
      });
      let result: any = null;
      try { result = await response.json(); } catch { result = null; }
      if (!response.ok) {
        toast.error(result?.error || t("finance.actions.singleBoletoError"));
        return;
      }
      toast.success(
        t("finance.actions.singleBoletoSuccess", { student: payment.student })
      );
      await onSuccess();
      if (result?.boleto?.bankSlipUrl) window.open(result.boleto.bankSlipUrl, "_blank", "noopener,noreferrer");
      else if (result?.boleto?.invoiceUrl) window.open(result.boleto.invoiceUrl, "_blank", "noopener,noreferrer");
      else if (result?.boleto?.pixCopyPaste) {
        await navigator.clipboard.writeText(result.boleto.pixCopyPaste);
        toast.success(t("finance.actions.pixCopied"));
      }
    } finally { setActionLoadingId(null); }
  }

  async function handleGenerateBoletoBatch(
    paymentIds: string[],
    method: ChargeMethod = "boleto"
  ) {
    try {
      setActionLoadingId("batch-boleto");
      const response = await fetch("/api/cobrancas/gerar-boleto-lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIds, method }),
      });
      let result: any = null;
      try { result = await response.json(); } catch { result = null; }
      if (!response.ok) {
        toast.error(result?.error || t("finance.actions.batchBoletoError"));
        return;
      }
      toast.success(t("finance.actions.batchBoletoSuccess"));
      await onSuccess();
      if (result?.boleto?.bankSlipUrl) window.open(result.boleto.bankSlipUrl, "_blank", "noopener,noreferrer");
      else if (result?.boleto?.invoiceUrl) window.open(result.boleto.invoiceUrl, "_blank", "noopener,noreferrer");
    } finally { setActionLoadingId(null); }
  }

  return {
    actionLoadingId,
    setActionLoadingId,
    generatingMonthlyPayments,
    handleDeletePayment,
    handlePay,
    handleSendReminder,
    handleGenerateMonthlyPayments,
    handleGenerateBoleto,
    handleGenerateBoletoBatch,
  };
}
