"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PaymentOption {
  id: string;
  student: string;
  description: string;
  amount: number;
  competence?: string;
  dueDate?: string;
  status?: "paid" | "pending" | "overdue";
}

interface GenerateBoletoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPayment: PaymentOption | null;
  payments?: PaymentOption[];
  loading?: boolean;
  generating?: boolean;
  onGenerate: (paymentIds: string[]) => Promise<void>;
}

export function GenerateBoletoModal({
  open,
  onOpenChange,
  initialPayment,
  payments = [],
  loading = false,
  generating = false,
  onGenerate,
}: GenerateBoletoModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      return;
    }

    if (initialPayment) {
      setSelectedIds([initialPayment.id]);
    }
  }, [open, initialPayment]);

  const availablePayments = useMemo(() => {
    const items = payments.length > 0 ? payments : initialPayment ? [initialPayment] : [];
    return items.filter((item) => item.status !== "paid");
  }, [payments, initialPayment]);

  const totalAmount = useMemo(() => {
    return availablePayments
      .filter((item) => selectedIds.includes(item.id))
      .reduce((sum, item) => sum + item.amount, 0);
  }, [availablePayments, selectedIds]);

  function togglePayment(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleGenerate() {
    if (selectedIds.length === 0) return;
    await onGenerate(selectedIds);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] rounded-[28px]">
        <DialogHeader>
          <DialogTitle>Gerar boleto consolidado</DialogTitle>
          <DialogDescription>
            Selecione as mensalidades pendentes ou atrasadas que deseja incluir em um único boleto.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando mensalidades...</p>
          ) : availablePayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma mensalidade disponível para gerar boleto.
            </p>
          ) : (
            availablePayments.map((payment) => {
              const checked = selectedIds.includes(payment.id);

              return (
                <button
                  key={payment.id}
                  type="button"
                  onClick={() => togglePayment(payment.id)}
                  className={`flex w-full items-start justify-between rounded-2xl border p-4 text-left transition ${
                    checked
                      ? "border-black bg-black/5 dark:border-white/20 dark:bg-white/10"
                      : "border-border bg-background hover:bg-muted/40"
                  }`}
                >
                  <div className="pr-4">
                    <p className="text-sm font-medium text-foreground">
                      {payment.description}
                    </p>

                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {payment.competence ? <span>{payment.competence}</span> : null}
                      {payment.dueDate ? <span>• Vencimento: {payment.dueDate}</span> : null}
                      {payment.status ? (
                        <span>
                          • {payment.status === "overdue" ? "Atrasado" : "Pendente"}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      R$ {payment.amount.toFixed(2).replace(".", ",")}
                    </span>

                    <div
                      className={`h-5 w-5 rounded border ${
                        checked
                          ? "border-black bg-black dark:border-white dark:bg-white"
                          : "border-border"
                      }`}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-muted/30 p-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              {selectedIds.length} mensalidade(s) selecionada(s)
            </p>
            <p className="text-xs text-muted-foreground">
              O boleto será gerado com valor consolidado.
            </p>
          </div>

          <p className="text-base font-semibold text-foreground">
            Total: R$ {totalAmount.toFixed(2).replace(".", ",")}
          </p>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generating}
            className="rounded-2xl"
          >
            Cancelar
          </Button>

          <Button
            onClick={handleGenerate}
            disabled={selectedIds.length === 0 || generating}
            className="rounded-2xl"
          >
            {generating ? "Gerando..." : "Gerar boleto"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}