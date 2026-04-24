"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PaymentActionItem {
  id: string;
  student: string;
  description: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  billingInvoiceUrl?: string | null;
  billingBankSlipUrl?: string | null;
  hasBoleto: boolean;
}

interface PaymentsTableActionsProps<T extends PaymentActionItem> {
  payment: T;
  isUpdating?: boolean;
  onViewDetails?: (payment: T) => void;
  onRegisterPayment?: (payment: {
    id: string;
    student: string;
    description: string;
    amount: number;
  }) => void;
  onDeletePayment?: (payment: {
    id: string;
    student: string;
    description: string;
    amount: number;
  }) => void;
  onSendReminder?: (payment: {
    id: string;
    student: string;
    description: string;
    amount: number;
  }) => void;
  onGenerateBoleto?: (payment: {
    id: string;
    student: string;
    description: string;
    amount: number;
  }) => void;
}

export function PaymentsTableActions<T extends PaymentActionItem>({
  payment,
  isUpdating = false,
  onViewDetails,
  onRegisterPayment,
  onDeletePayment,
  onSendReminder,
  onGenerateBoleto,
}: PaymentsTableActionsProps<T>) {
  const boletoUrl = payment.billingBankSlipUrl || payment.billingInvoiceUrl;

  async function handleCopyBoletoLink() {
    if (!boletoUrl) return;
    await navigator.clipboard.writeText(boletoUrl);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isUpdating}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewDetails?.(payment)}>
          Ver detalhes
        </DropdownMenuItem>

        {boletoUrl ? (
          <DropdownMenuItem onClick={handleCopyBoletoLink}>
            Copiar link do boleto
          </DropdownMenuItem>
        ) : null}

        {payment.status !== "paid" ? (
          <DropdownMenuItem
            onClick={() =>
              onRegisterPayment?.({
                id: payment.id,
                student: payment.student,
                description: payment.description,
                amount: payment.amount,
              })
            }
            disabled={isUpdating}
          >
            {isUpdating ? "Registrando..." : "Registrar pagamento"}
          </DropdownMenuItem>
        ) : null}

        {payment.status !== "paid" ? (
          <DropdownMenuItem
            onClick={() =>
              onSendReminder?.({
                id: payment.id,
                student: payment.student,
                description: payment.description,
                amount: payment.amount,
              })
            }
            disabled={isUpdating}
          >
            {isUpdating ? "Enviando..." : "Enviar lembrete"}
          </DropdownMenuItem>
        ) : null}

        {payment.status !== "paid" ? (
          <DropdownMenuItem
            onClick={() =>
              onGenerateBoleto?.({
                id: payment.id,
                student: payment.student,
                description: payment.description,
                amount: payment.amount,
              })
            }
            disabled={isUpdating}
          >
            {payment.hasBoleto ? "Gerenciar boleto" : "Gerar boleto"}
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuItem
          className="text-destructive"
          onClick={() =>
            onDeletePayment?.({
              id: payment.id,
              student: payment.student,
              description: payment.description,
              amount: payment.amount,
            })
          }
          disabled={isUpdating || payment.status === "paid"}
        >
          Excluir mensalidade
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}