import { Prisma } from "@prisma/client";

export type LineInput = {
  quantidade: number;
  valorUnitario: number;
  desconto?: number;
};

export function computeInvoiceTotals(lines: LineInput[]): {
  subtotal: Prisma.Decimal;
  descontoTotal: Prisma.Decimal;
  total: Prisma.Decimal;
} {
  let sub = 0;
  let disc = 0;
  for (const ln of lines) {
    const q = ln.quantidade;
    const u = ln.valorUnitario;
    const d = ln.desconto ?? 0;
    sub += q * u;
    disc += d;
  }
  const total = Math.max(0, sub - disc);
  return {
    subtotal: new Prisma.Decimal(sub.toFixed(2)),
    descontoTotal: new Prisma.Decimal(disc.toFixed(2)),
    total: new Prisma.Decimal(total.toFixed(2)),
  };
}
