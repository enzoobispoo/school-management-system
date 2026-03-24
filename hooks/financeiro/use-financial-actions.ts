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

  return {
    actionLoadingId,
    generatingMonthlyPayments,
    handleDeletePayment,
    handlePay,
    handleGenerateMonthlyPayments,
  };
}