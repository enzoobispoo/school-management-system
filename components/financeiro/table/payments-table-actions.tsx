"use client";

import { toast } from "sonner";
import { Download, MoreHorizontal, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PaymentActionItem {
  id: string;
  studentId: string;
  demonstrativoIrAno: number;
  student: string;
  description: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  billingInvoiceUrl?: string | null;
  billingBankSlipUrl?: string | null;
  hasBoleto: boolean;
  date?: string;
  dueDate?: string;
  competence?: string;
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
  onPrintReceipt?: (payment: T) => void;
  onDemonstrativoIr?: (payment: T) => void;
}

function printReceipt(payment: PaymentActionItem, schoolName: string) {
  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const win = window.open("", "_blank", "width=700,height=900");
  if (!win) return;

  win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Recibo de Pagamento</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #111; background: #fff; padding: 48px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 20px; margin-bottom: 32px; }
    .school { font-size: 22px; font-weight: 700; letter-spacing: -0.03em; }
    .receipt-label { font-size: 13px; color: #666; text-align: right; }
    .receipt-label strong { display: block; font-size: 18px; font-weight: 700; color: #111; margin-top: 4px; }
    .amount-box { background: #f5f5f5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px; }
    .amount-label { font-size: 13px; color: #666; margin-bottom: 6px; }
    .amount-value { font-size: 36px; font-weight: 700; letter-spacing: -0.04em; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
    .field { background: #fafafa; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; }
    .field-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #888; margin-bottom: 4px; }
    .field-value { font-size: 14px; font-weight: 500; }
    .footer { border-top: 1px solid #e5e7eb; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; }
    .footer-note { font-size: 12px; color: #999; }
    .id { font-size: 11px; color: #bbb; font-family: monospace; }
    @media print { body { padding: 32px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="school">${schoolName || "Escola"}</div>
    <div class="receipt-label">Recibo de Pagamento<strong>#${payment.id.slice(-8).toUpperCase()}</strong></div>
  </div>
  <div class="amount-box">
    <div class="amount-label">Valor pago</div>
    <div class="amount-value">${fmt(payment.amount)}</div>
  </div>
  <div class="grid">
    <div class="field"><div class="field-label">Aluno</div><div class="field-value">${payment.student}</div></div>
    <div class="field"><div class="field-label">Descrição</div><div class="field-value">${payment.description}</div></div>
    ${payment.competence ? `<div class="field"><div class="field-label">Competência</div><div class="field-value">${payment.competence}</div></div>` : ""}
    ${payment.dueDate ? `<div class="field"><div class="field-label">Vencimento</div><div class="field-value">${payment.dueDate}</div></div>` : ""}
    ${payment.date ? `<div class="field"><div class="field-label">Data do pagamento</div><div class="field-value">${payment.date}</div></div>` : ""}
  </div>
  <div class="footer">
    <div class="footer-note">Emitido em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
    <div class="id">${payment.id}</div>
  </div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`);
  win.document.close();
}

export function PaymentsTableActions<T extends PaymentActionItem>({
  payment,
  isUpdating = false,
  onViewDetails,
  onRegisterPayment,
  onDeletePayment,
  onSendReminder,
  onGenerateBoleto,
  onPrintReceipt,
  onDemonstrativoIr,
}: PaymentsTableActionsProps<T>) {
  const boletoUrl = payment.billingBankSlipUrl || payment.billingInvoiceUrl;

  async function handleCopyBoletoLink() {
    if (!boletoUrl) return;
    await navigator.clipboard.writeText(boletoUrl);
  }

  async function handlePrintReceipt() {
    // chama o callback externo se existir, senão imprime direto
    if (onPrintReceipt) {
      onPrintReceipt(payment);
      return;
    }
    // fallback: busca nome da escola e imprime direto
    let schoolName = "";
    try {
      const res = await fetch("/api/settings/escola", { cache: "no-store" });
      const data = await res.json();
      schoolName = data.nomeEscola ?? "";
    } catch {}
    printReceipt(payment, schoolName);
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

        {onDemonstrativoIr ? (
          <DropdownMenuItem onClick={() => onDemonstrativoIr(payment)}>
            <Download className="mr-2 h-3.5 w-3.5" />
            Demonstrativo IR
          </DropdownMenuItem>
        ) : null}

        {payment.status === "paid" && (
          <DropdownMenuItem onClick={handlePrintReceipt}>
            <FileText className="mr-2 h-3.5 w-3.5" />
            Imprimir recibo
          </DropdownMenuItem>
        )}

        {boletoUrl && (
          <DropdownMenuItem onClick={handleCopyBoletoLink}>
            Copiar link do boleto
          </DropdownMenuItem>
        )}

        {payment.status !== "paid" && (
          <DropdownMenuItem
            onClick={() => onRegisterPayment?.({ id: payment.id, student: payment.student, description: payment.description, amount: payment.amount })}
            disabled={isUpdating}
          >
            {isUpdating ? "Registrando..." : "Registrar pagamento"}
          </DropdownMenuItem>
        )}

        {payment.status !== "paid" && (
          <DropdownMenuItem
            onClick={() => onSendReminder?.({ id: payment.id, student: payment.student, description: payment.description, amount: payment.amount })}
            disabled={isUpdating}
          >
            {isUpdating ? "Enviando..." : "Enviar lembrete"}
          </DropdownMenuItem>
        )}

        {payment.status !== "paid" && (
          <DropdownMenuItem
            onClick={() => onGenerateBoleto?.({ id: payment.id, student: payment.student, description: payment.description, amount: payment.amount })}
            disabled={isUpdating}
          >
            {payment.hasBoleto ? "Gerenciar boleto" : "Gerar boleto"}
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          className="text-destructive"
          onClick={() => onDeletePayment?.({ id: payment.id, student: payment.student, description: payment.description, amount: payment.amount })}
          disabled={isUpdating || payment.status === "paid"}
        >
          Excluir mensalidade
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
