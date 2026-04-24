"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentSendHistory } from "@/components/financeiro/payment-send-history";

interface PaymentDetailsModalProps {
  open: boolean;
  onClose: () => void;
  payment: {
    id: string;
    student: string;
    description: string;
    amount: number;
    status: "paid" | "pending" | "overdue";
    date: string;
    dueDate: string;
  } | null;
}

const statusLabel = {
  paid: "Pago",
  pending: "Pendente",
  overdue: "Atrasado",
};

export function PaymentDetailsModal({
  open,
  onClose,
  payment,
}: PaymentDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px] rounded-[28px] border border-black/5 bg-white text-black shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white">
        <DialogHeader>
          <DialogTitle className="text-black dark:text-white">
            Detalhes do pagamento
          </DialogTitle>
          <DialogDescription className="text-black/42 dark:text-white/60">
            Informações completas da cobrança selecionada.
          </DialogDescription>
        </DialogHeader>

        {payment ? (
          <div className="space-y-6">
            <div className="grid gap-3 text-sm">
              <div>
                <span className="font-medium text-black dark:text-white">
                  Aluno:
                </span>{" "}
                <span className="text-black/55 dark:text-white/60">
                  {payment.student}
                </span>
              </div>

              <div>
                <span className="font-medium text-black dark:text-white">
                  Descrição:
                </span>{" "}
                <span className="text-black/55 dark:text-white/60">
                  {payment.description}
                </span>
              </div>

              <div>
                <span className="font-medium text-black dark:text-white">
                  Valor:
                </span>{" "}
                <span className="text-black/55 dark:text-white/60">
                  R$ {payment.amount.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <div>
                <span className="font-medium text-black dark:text-white">
                  Status:
                </span>{" "}
                <span className="text-black/55 dark:text-white/60">
                  {statusLabel[payment.status]}
                </span>
              </div>

              <div>
                <span className="font-medium text-black dark:text-white">
                  Vencimento:
                </span>{" "}
                <span className="text-black/55 dark:text-white/60">
                  {payment.dueDate}
                </span>
              </div>

              <div>
                <span className="font-medium text-black dark:text-white">
                  Pagamento:
                </span>{" "}
                <span className="text-black/55 dark:text-white/60">
                  {payment.date}
                </span>
              </div>
            </div>

            <PaymentSendHistory paymentId={payment.id} />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}