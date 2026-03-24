"use client";

import { useState } from "react";
import type { PaymentTableItem } from "@/hooks/financeiro/use-financial-query";

export function useFinancialModals() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  return {
    detailsOpen,
    setDetailsOpen,
    paymentConfirmOpen,
    setPaymentConfirmOpen,
    generateDialogOpen,
    setGenerateDialogOpen,
    deleteOpen,
    setDeleteOpen,
    selectedPayment,
    setSelectedPayment,
    selectedPaymentDetails,
    setSelectedPaymentDetails,
    selectedPaymentToDelete,
    setSelectedPaymentToDelete,
    openRegisterPayment,
    closeRegisterPayment,
    openPaymentDetails,
    closePaymentDetails,
    openDeletePayment,
    closeDeletePayment,
  };
}