"use client";

import { useState } from "react";
import { toast } from "sonner";

export function useFinancialActions(onSuccess: () => Promise<void>) {
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [generatingMonthlyPayments, setGeneratingMonthlyPayments] = useState(false);

  async function handleDeletePayment(paymentId: string) {
    try {
      setActionLoadingId(paymentId);
      const response = await fetch(`/api/pagamentos/${paymentId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) { toast.error(result.error || "Erro ao excluir mensalidade"); return; }
      toast.success("Mensalidade excluída com sucesso");
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
      if (!response.ok) { toast.error(result.error || "Erro ao registrar pagamento"); return; }
      toast.success("Pagamento registrado com sucesso");
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
      if (!response.ok) { toast.error(result.error || "Erro ao enviar lembrete"); return; }
      toast.success(`Cobrança enviada para ${payment.student}`);
      await onSuccess();
    } finally { setActionLoadingId(null); }
  }

  async function handleGenerateMonthlyPayments() {
    try {
      setGeneratingMonthlyPayments(true);
      const loadingToast = toast.loading("Gerando mensalidades...");
      const response = await fetch("/api/pagamentos/gerar-mensalidades", { method: "POST" });
      const result = await response.json();
      toast.dismiss(loadingToast);
      if (!response.ok) { toast.error(result.error || "Erro ao gerar mensalidades"); return; }
      toast.success(`${result.generatedCount ?? 0} mensalidade(s) criada(s) com sucesso`);
      await onSuccess();
    } finally { setGeneratingMonthlyPayments(false); }
  }

  async function handleGenerateBoleto(payment: { id: string; student: string; description: string; amount: number }) {
    try {
      setActionLoadingId(payment.id);
      const response = await fetch("/api/cobrancas/gerar-boleto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment.id }),
      });
      let result: any = null;
      try { result = await response.json(); } catch { result = null; }
      if (!response.ok) { toast.error(result?.error || "Erro ao gerar boleto"); return; }
      toast.success(`Boleto de ${payment.student} gerado com sucesso`);
      await onSuccess();
      if (result?.boleto?.bankSlipUrl) window.open(result.boleto.bankSlipUrl, "_blank", "noopener,noreferrer");
      else if (result?.boleto?.invoiceUrl) window.open(result.boleto.invoiceUrl, "_blank", "noopener,noreferrer");
    } finally { setActionLoadingId(null); }
  }

  async function handleGenerateBoletoBatch(paymentIds: string[]) {
    try {
      setActionLoadingId("batch-boleto");
      const response = await fetch("/api/cobrancas/gerar-boleto-lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIds }),
      });
      let result: any = null;
      try { result = await response.json(); } catch { result = null; }
      if (!response.ok) { toast.error(result?.error || "Erro ao gerar boleto consolidado"); return; }
      toast.success("Boleto consolidado criado com sucesso");
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
