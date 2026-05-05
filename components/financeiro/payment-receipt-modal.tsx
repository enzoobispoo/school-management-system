"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface ReceiptData {
  id: string;
  student: string;
  description: string;
  amount: number;
  date: string;
  dueDate: string;
  competence?: string;
  metodoPagamento?: string | null;
}

interface PaymentReceiptModalProps {
  open: boolean;
  onClose: () => void;
  payment: ReceiptData | null;
  schoolName?: string;
}

export function PaymentReceiptModal({
  open,
  onClose,
  payment,
  schoolName,
}: PaymentReceiptModalProps) {
  const [escola, setEscola] = useState(schoolName ?? "");

  useEffect(() => {
    if (!schoolName) {
      fetch("/api/settings/escola", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => { if (d.nomeEscola) setEscola(d.nomeEscola); })
        .catch(() => {});
    }
  }, [schoolName]);

  function handlePrint() {
    const win = window.open("", "_blank", "width=700,height=900");
    if (!win || !payment) return;

    const fmt = (v: number) =>
      v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
    <div class="school">${escola || "Escola"}</div>
    <div class="receipt-label">Recibo de Pagamento<strong>#${payment.id.slice(-8).toUpperCase()}</strong></div>
  </div>

  <div class="amount-box">
    <div class="amount-label">Valor pago</div>
    <div class="amount-value">${fmt(payment.amount)}</div>
  </div>

  <div class="grid">
    <div class="field">
      <div class="field-label">Aluno</div>
      <div class="field-value">${payment.student}</div>
    </div>
    <div class="field">
      <div class="field-label">Descrição</div>
      <div class="field-value">${payment.description}</div>
    </div>
    ${payment.competence ? `
    <div class="field">
      <div class="field-label">Competência</div>
      <div class="field-value">${payment.competence}</div>
    </div>` : ""}
    <div class="field">
      <div class="field-label">Vencimento</div>
      <div class="field-value">${payment.dueDate}</div>
    </div>
    <div class="field">
      <div class="field-label">Data do pagamento</div>
      <div class="field-value">${payment.date || "—"}</div>
    </div>
    ${payment.metodoPagamento ? `
    <div class="field">
      <div class="field-label">Forma de pagamento</div>
      <div class="field-value">${payment.metodoPagamento}</div>
    </div>` : ""}
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

  if (!payment) return null;

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-[480px] rounded-[28px]">
        <DialogHeader>
          <DialogTitle>Recibo de pagamento</DialogTitle>
          <DialogDescription>
            Prévia do recibo. Clique em imprimir para gerar o PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Preview */}
          <div className="rounded-2xl border border-border bg-muted/30 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{escola || "Escola"}</span>
              <span className="text-xs text-muted-foreground font-mono">#{payment.id.slice(-8).toUpperCase()}</span>
            </div>

            <div className="rounded-xl bg-background border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Valor pago</p>
              <p className="text-3xl font-bold tracking-tight text-foreground">{fmt(payment.amount)}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                { label: "Aluno", value: payment.student },
                { label: "Descrição", value: payment.description },
                { label: "Vencimento", value: payment.dueDate },
                { label: "Pagamento", value: payment.date || "—" },
                ...(payment.metodoPagamento ? [{ label: "Forma", value: payment.metodoPagamento }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-background border border-border/50 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="font-medium text-foreground truncate">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <Button className="w-full rounded-2xl gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
