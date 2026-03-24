"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
      <DialogContent className="sm:max-w-[520px] rounded-[28px] border border-black/[0.05] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
        <DialogHeader>
          <DialogTitle>Detalhes do pagamento</DialogTitle>
          <DialogDescription>
            Informações completas da cobrança selecionada.
          </DialogDescription>
        </DialogHeader>

        {payment ? (
          <div className="grid gap-3 text-sm">
            <div>
              <span className="font-medium text-black">Aluno:</span>{" "}
              <span className="text-black/60">{payment.student}</span>
            </div>

            <div>
              <span className="font-medium text-black">Descrição:</span>{" "}
              <span className="text-black/60">{payment.description}</span>
            </div>

            <div>
              <span className="font-medium text-black">Valor:</span>{" "}
              <span className="text-black/60">
                R$ {payment.amount.toFixed(2).replace(".", ",")}
              </span>
            </div>

            <div>
              <span className="font-medium text-black">Status:</span>{" "}
              <span className="text-black/60">
                {statusLabel[payment.status]}
              </span>
            </div>

            <div>
              <span className="font-medium text-black">Vencimento:</span>{" "}
              <span className="text-black/60">{payment.dueDate}</span>
            </div>

            <div>
              <span className="font-medium text-black">Pagamento:</span>{" "}
              <span className="text-black/60">{payment.date}</span>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}