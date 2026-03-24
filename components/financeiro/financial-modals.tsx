"use client";

import { PaymentConfirmModal } from "@/components/financeiro/payment-confirm-modal";
import { PaymentDetailsModal } from "@/components/financeiro/payment-details-modal";
import { DeletePaymentModal } from "@/components/financeiro/delete-payment-modal";
import type { PaymentTableItem } from "@/hooks/financeiro/use-financial-query";

interface FinancialModalsProps {
  paymentConfirmOpen: boolean;
  onClosePaymentConfirm: () => void;
  selectedPayment: {
    id: string;
    student: string;
    description: string;
    amount: number;
  } | null;
  detailsOpen: boolean;
  onCloseDetails: () => void;
  selectedPaymentDetails: PaymentTableItem | null;
  deleteOpen: boolean;
  onCloseDelete: () => void;
  selectedPaymentToDelete: {
    id: string;
    student: string;
    description: string;
    amount: number;
  } | null;
  actionLoadingId: string | null;
  onConfirmPayment: (
    paymentId: string,
    metodoPagamento: string
  ) => Promise<void>;
  onConfirmDelete: () => Promise<void>;
}

export function FinancialModals({
  paymentConfirmOpen,
  onClosePaymentConfirm,
  selectedPayment,
  detailsOpen,
  onCloseDetails,
  selectedPaymentDetails,
  deleteOpen,
  onCloseDelete,
  selectedPaymentToDelete,
  actionLoadingId,
  onConfirmPayment,
  onConfirmDelete,
}: FinancialModalsProps) {
  return (
    <>
      <PaymentConfirmModal
        open={paymentConfirmOpen}
        onClose={onClosePaymentConfirm}
        payment={selectedPayment}
        onConfirm={onConfirmPayment}
        loading={actionLoadingId === selectedPayment?.id}
      />

      <PaymentDetailsModal
        open={detailsOpen}
        onClose={onCloseDetails}
        payment={selectedPaymentDetails}
      />

      <DeletePaymentModal
        open={deleteOpen}
        onClose={onCloseDelete}
        payment={selectedPaymentToDelete}
        onConfirm={async () => {
          await onConfirmDelete();
        }}
        loading={actionLoadingId === selectedPaymentToDelete?.id}
      />
    </>
  );
}