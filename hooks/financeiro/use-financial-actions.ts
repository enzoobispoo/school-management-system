"use client";

import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export function useFinancialActions(onSuccess: () => Promise<void>) {
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [generatingMonthlyPayments, setGeneratingMonthlyPayments] =
    useState(false);

  async function handleDeletePayment(paymentId: string) {
    try {
      setActionLoadingId(paymentId);

      const response = await fetch(`/api/pagamentos/${paymentId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao excluir mensalidade");
      }

      toast({
        title: "Mensalidade excluída",
        description: "A cobrança foi removida com sucesso.",
      });

      await onSuccess();
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handlePay(id: string, metodoPagamento: string) {
    try {
      setActionLoadingId(id);

      const response = await fetch(`/api/pagamentos/${id}/pagar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metodoPagamento,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao registrar pagamento");
      }

      toast({
        title: "Pagamento registrado",
        description: "O pagamento foi confirmado com sucesso.",
      });

      await onSuccess();
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleSendReminder(payment: {
    id: string;
    student: string;
    description: string;
    amount: number;
  }) {
    try {
      setActionLoadingId(payment.id);

      const response = await fetch("/api/cobrancas/enviar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId: payment.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao enviar lembrete");
      }

      toast({
        title: "Lembrete enviado",
        description: `A cobrança foi enviada para ${payment.student}.`,
      });

      await onSuccess();
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleGenerateMonthlyPayments() {
    try {
      setGeneratingMonthlyPayments(true);

      toast({
        title: "Gerando mensalidades...",
        description: "Aguarde enquanto o sistema cria as próximas cobranças.",
      });

      const response = await fetch("/api/pagamentos/gerar-mensalidades", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao gerar mensalidades");
      }

      toast({
        title: "Mensalidades geradas",
        description: `${
          result.generatedCount ?? 0
        } mensalidade(s) criada(s) com sucesso.`,
      });

      await onSuccess();
    } finally {
      setGeneratingMonthlyPayments(false);
    }
  }

  async function handleGenerateBoleto(payment: {
    id: string;
    student: string;
    description: string;
    amount: number;
  }) {
    try {
      setActionLoadingId(payment.id);

      const response = await fetch("/api/cobrancas/gerar-boleto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId: payment.id,
        }),
      });

      let result: any = null;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(result?.error || "Erro ao gerar boleto");
      }

      toast({
        title: "Boleto gerado",
        description: `O boleto de ${payment.student} foi gerado com sucesso.`,
      });

      await onSuccess();

      if (result?.boleto?.bankSlipUrl) {
        window.open(result.boleto.bankSlipUrl, "_blank", "noopener,noreferrer");
      } else if (result?.boleto?.invoiceUrl) {
        window.open(result.boleto.invoiceUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleGenerateBoletoBatch(paymentIds: string[]) {
    try {
      setActionLoadingId("batch-boleto");

      const response = await fetch("/api/cobrancas/gerar-boleto-lote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentIds,
        }),
      });

      let result: any = null;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(result?.error || "Erro ao gerar boleto consolidado");
      }

      toast({
        title: "Boleto gerado",
        description: "Boleto consolidado criado com sucesso.",
      });

      await onSuccess();

      if (result?.boleto?.bankSlipUrl) {
        window.open(result.boleto.bankSlipUrl, "_blank", "noopener,noreferrer");
      } else if (result?.boleto?.invoiceUrl) {
        window.open(result.boleto.invoiceUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setActionLoadingId(null);
    }
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