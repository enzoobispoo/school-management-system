"use client";

import { useState } from "react";
import type { PaymentTableItem } from "@/hooks/financeiro/use-financial-query";

type BoletoSelectionPayment = {
  id: string;
  student: string;
  description: string;
  amount: number;
};

export function useFinancialModals() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [generateBoletoOpen, setGenerateBoletoOpen] = useState(false);
  const [selectedPaymentForBoleto, setSelectedPaymentForBoleto] =
    useState<BoletoSelectionPayment | null>(null);

  const [selectedPayment, setSelectedPayment] = useState<{
    id: string;
    student: string;
    description: string;
    amount: number;
  } | null>(null);

  const [selectedPaymentDetails, setSelectedPaymentDetails] =
    useState<PaymentTableItem | null>(null);

  const [selectedPaymentToDelete, setSelectedPaymentToDelete] = useState<{
    id: string;
    student: string;
    description: string;
    amount: number;
  } | null>(null);

  function openRegisterPayment(payment: {
    id: string;
    student: string;
    description: string;
    amount: number;
  }) {
    setSelectedPayment(payment);
    setPaymentConfirmOpen(true);
  }

  function closeRegisterPayment() {
    setPaymentConfirmOpen(false);
    setSelectedPayment(null);
  }

  function openPaymentDetails(payment: PaymentTableItem) {
    setSelectedPaymentDetails(payment);
    setDetailsOpen(true);
  }

  function closePaymentDetails() {
    setDetailsOpen(false);
    setSelectedPaymentDetails(null);
  }

  function openDeletePayment(payment: {
    id: string;
    student: string;
    description: string;
    amount: number;
  }) {
    setSelectedPaymentToDelete(payment);
    setDeleteOpen(true);
  }

  function closeDeletePayment() {
    setDeleteOpen(false);
    setSelectedPaymentToDelete(null);
  }

  function openGenerateBoleto(payment: BoletoSelectionPayment) {
    setSelectedPaymentForBoleto(payment);
    setGenerateBoletoOpen(true);
  }

  function closeGenerateBoleto() {
    setGenerateBoletoOpen(false);
    setSelectedPaymentForBoleto(null);
  }

  return {
    detailsOpen,
    setDetailsOpen,
    paymentConfirmOpen,
    setPaymentConfirmOpen,
    generateDialogOpen,
    setGenerateDialogOpen,
    deleteOpen,
    setDeleteOpen,
    generateBoletoOpen,
    setGenerateBoletoOpen,
    selectedPayment,
    setSelectedPayment,
    selectedPaymentDetails,
    setSelectedPaymentDetails,
    selectedPaymentToDelete,
    setSelectedPaymentToDelete,
    selectedPaymentForBoleto,
    setSelectedPaymentForBoleto,
    openRegisterPayment,
    closeRegisterPayment,
    openPaymentDetails,
    closePaymentDetails,
    openDeletePayment,
    closeDeletePayment,
    openGenerateBoleto,
    closeGenerateBoleto,
  };
}