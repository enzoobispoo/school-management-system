"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaymentConfirmFormProps {
  payment: {
    student: string;
    description: string;
    amount: number;
  };
  metodoPagamento: string;
  setMetodoPagamento: (value: string) => void;
  error: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function PaymentConfirmForm({
  payment,
  metodoPagamento,
  setMetodoPagamento,
  error,
  loading = false,
  onCancel,
  onConfirm,
}: PaymentConfirmFormProps) {
  return (
    <>
      <div className="grid gap-4 py-2">
        <div className="rounded-[22px] border border-black/[0.05] bg-[#fafafa] p-4">
          <div className="grid gap-2 text-sm">
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
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Método de pagamento</Label>
          <Select
            value={metodoPagamento}
            onValueChange={setMetodoPagamento}
            disabled={loading}
          >
            <SelectTrigger className="rounded-2xl">
              <SelectValue placeholder="Selecione um método" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PIX">Pix</SelectItem>
              <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
              <SelectItem value="CARTAO">Cartão</SelectItem>
              <SelectItem value="BOLETO">Boleto</SelectItem>
              <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="rounded-2xl"
        >
          Cancelar
        </Button>
        <Button
          onClick={async () => {
            await onConfirm();
          }}
          disabled={loading}
          className="rounded-2xl bg-black text-white hover:bg-black/90"
        >
          {loading ? "Confirmando..." : "Confirmar pagamento"}
        </Button>
      </DialogFooter>
    </>
  );
}