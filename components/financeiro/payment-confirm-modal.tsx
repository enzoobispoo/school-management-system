"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentConfirmForm } from "@/components/financeiro/payment/payment-confirm-form";
import { usePaymentConfirmModal } from "@/hooks/financeiro/use-payment-confirm-modal";

interface PaymentConfirmModalProps {
  open: boolean;
  onClose: () => void;
  payment: {
    id: string;
    student: string;
    description: string;
    amount: number;
  } | null;
  onConfirm: (paymentId: string, metodoPagamento: string) => Promise<void>;
  loading?: boolean;
}

export function PaymentConfirmModal({
  open,
  onClose,
  payment,
  onConfirm,
  loading = false,
}: PaymentConfirmModalProps) {
  const {
    metodoPagamento,
    setMetodoPagamento,
    error,
    handleClose,
    handleConfirm,
  } = usePaymentConfirmModal({
    open,
    onClose,
    payment,
    onConfirm,
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-[480px] rounded-[28px] border border-black/5 bg-white text-black shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white">
        <DialogHeader>
          <DialogTitle className="text-black dark:text-white">
            Registrar pagamento
          </DialogTitle>
          <DialogDescription className="text-black/42 dark:text-white/60">
            Confirme o pagamento e selecione o método utilizado.
          </DialogDescription>
        </DialogHeader>

        {payment ? (
          <PaymentConfirmForm
            payment={payment}
            metodoPagamento={metodoPagamento}
            setMetodoPagamento={setMetodoPagamento}
            error={error}
            loading={loading}
            onCancel={handleClose}
            onConfirm={handleConfirm}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}