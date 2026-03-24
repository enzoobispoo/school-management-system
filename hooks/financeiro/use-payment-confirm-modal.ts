"use client";

import { useEffect, useState } from "react";

interface UsePaymentConfirmModalParams {
  open: boolean;
  onClose: () => void;
  payment: {
    id: string;
    student: string;
    description: string;
    amount: number;
  } | null;
  onConfirm: (paymentId: string, metodoPagamento: string) => Promise<void>;
}

export function usePaymentConfirmModal({
  open,
  onClose,
  payment,
  onConfirm,
}: UsePaymentConfirmModalParams) {
  const [metodoPagamento, setMetodoPagamento] = useState("PIX");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setMetodoPagamento("PIX");
      setError("");
    }
  }, [open]);

  function handleClose() {
    setMetodoPagamento("PIX");
    setError("");
    onClose();
  }

  async function handleConfirm() {
    if (!payment?.id) {
      setError("Pagamento inválido.");
      return;
    }

    if (!metodoPagamento) {
      setError("Selecione um método de pagamento.");
      return;
    }

    try {
      setError("");
      await onConfirm(payment.id, metodoPagamento);
      setMetodoPagamento("PIX");
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível confirmar o pagamento."
      );
    }
  }

  return {
    metodoPagamento,
    setMetodoPagamento,
    error,
    handleClose,
    handleConfirm,
  };
}