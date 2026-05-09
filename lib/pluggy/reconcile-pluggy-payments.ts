import "server-only";

import { Prisma, StatusPagamento, type Pagamento } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { extractPixTxIdsFromBrCodes } from "@/lib/pluggy/pix-brcode-txid";

const EPS = 0.02;
const WINDOW_MS = 120 * 86400000;
/** Evita falso positivo em textos genéricos (“1234567890” etc.). */
const MIN_SUBSTRING_TOKEN_LEN = 10;

function amountsMatch(a: number, b: number): boolean {
  return Math.abs(a - b) <= EPS;
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

type LoosePaymentData = {
  receiverReferenceId?: string;
  referenceNumber?: string;
  reason?: string;
  boletoMetadata?: { digitableLine?: string | null; barcode?: string | null };
};

function parsePaymentData(j: Prisma.JsonValue | null): LoosePaymentData {
  if (!j || typeof j !== "object" || Array.isArray(j)) return {};
  return j as LoosePaymentData;
}

function flattenPaymentDataStrings(j: unknown): string[] {
  if (j == null) return [];
  if (typeof j === "string") return [j];
  if (typeof j === "number" || typeof j === "boolean") return [String(j)];
  if (Array.isArray(j)) return j.flatMap(flattenPaymentDataStrings);
  if (typeof j === "object") {
    return Object.values(j as object).flatMap(flattenPaymentDataStrings);
  }
  return [];
}

function buildTransactionHaystack(tx: {
  description: string;
  descriptionRaw: string | null;
  paymentData: Prisma.JsonValue | null;
}): string {
  const parts = [
    tx.description,
    tx.descriptionRaw ?? "",
    ...flattenPaymentDataStrings(tx.paymentData),
  ];
  return normalize(parts.join("\n"));
}

/**
 * Força do vínculo por identificador (PIX TXID, invoice Asaas, id interno da parcela).
 * Retorna 0 se não houver match por ID ou se o valor não bater com a tolerância.
 */
function identifierMatchStrength(
  p: Pagamento,
  txAmount: number,
  haystack: string,
  pd: LoosePaymentData
): number {
  if (!amountsMatch(Number(p.valor), txAmount)) return 0;

  const pixIds = extractPixTxIdsFromBrCodes(p.billingPixCopyPaste, p.billingPixQrCode);
  const recvRef = pd.receiverReferenceId?.trim();
  if (recvRef) {
    const recvNorm = normalize(recvRef);
    if (pixIds.some((id) => normalize(id) === recvNorm)) return 1000;
  }

  const refNum = normalize(pd.referenceNumber ?? "");
  const billingExt = p.billingExternalId?.trim();
  if (refNum && billingExt && normalize(billingExt) === refNum) return 960;

  const candidates: { token: string; weight: number }[] = [];
  if (billingExt) {
    candidates.push({ token: normalize(billingExt), weight: 920 });
    const d = digitsOnly(billingExt);
    if (d.length >= MIN_SUBSTRING_TOKEN_LEN) candidates.push({ token: d, weight: 910 });
  }

  candidates.push({ token: normalize(p.id), weight: 880 });

  for (const pix of pixIds) {
    const n = normalize(pix);
    if (n.length >= MIN_SUBSTRING_TOKEN_LEN) candidates.push({ token: n, weight: 900 });
  }

  let best = 0;
  for (const { token, weight } of candidates) {
    if (token.length < MIN_SUBSTRING_TOKEN_LEN) continue;
    if (haystack.includes(token)) best = Math.max(best, weight);
  }

  const boletoDigits = [
    pd.boletoMetadata?.digitableLine,
    pd.boletoMetadata?.barcode,
  ]
    .map((x) => (x ? digitsOnly(x) : ""))
    .filter((x) => x.length >= MIN_SUBSTRING_TOKEN_LEN);

  for (const dig of boletoDigits) {
    if (haystack.includes(dig)) best = Math.max(best, 870);
  }

  // TXID PIX curto: só se bater exato com receiverReferenceId da instituição (já coberto)
  // ou aparecer integralmente no extrato (substring curta)
  for (const pix of pixIds) {
    const n = normalize(pix);
    if (n.length >= 4 && n.length < MIN_SUBSTRING_TOKEN_LEN && haystack.includes(n)) {
      best = Math.max(best, 860);
    }
  }

  return best;
}

function pickFallbackByDate(
  valorMatches: Pagamento[],
  txDate: Date
): Pagamento | null {
  const scored = valorMatches
    .map((p) => ({
      p,
      delta: Math.abs(txDate.getTime() - p.vencimento.getTime()),
    }))
    .filter(({ delta }) => delta <= WINDOW_MS)
    .sort((a, b) => a.delta - b.delta);
  return scored[0]?.p ?? null;
}

/**
 * Concilia créditos Pluggy com mensalidades:
 * 1) Identificadores (PIX TXID / receiverReferenceId, billingExternalId Asaas, id da parcela no extrato);
 * 2) Fallback: mesmo valor + janela de datas (menor distância ao vencimento).
 */
export async function reconcilePluggyCreditsForSchool(schoolId: string): Promise<number> {
  const txs = await prisma.pluggyTransaction.findMany({
    where: {
      schoolId,
      reconciledPagamentoId: null,
      type: "CREDIT",
    },
    orderBy: { date: "desc" },
    take: 800,
  });

  let pool = await prisma.pagamento.findMany({
    where: {
      schoolId,
      status: { in: [StatusPagamento.PENDENTE, StatusPagamento.ATRASADO] },
    },
    take: 400,
  });

  let applied = 0;

  for (const tx of txs) {
    const amt = Number(tx.amount);
    if (!Number.isFinite(amt) || amt <= EPS) continue;

    const haystack = buildTransactionHaystack(tx);
    const pd = parsePaymentData(tx.paymentData);

    let bestPay: Pagamento | null = null;
    let strength = 0;
    let bestDeltaForStrength = Number.POSITIVE_INFINITY;
    let mode: "identifier" | "fallback" = "fallback";

    const valorMatches = pool.filter((p) => amountsMatch(Number(p.valor), amt));

    for (const p of valorMatches) {
      const s = identifierMatchStrength(p, amt, haystack, pd);
      if (s <= 0) continue;
      const delta = Math.abs(tx.date.getTime() - p.vencimento.getTime());
      if (
        s > strength ||
        (s === strength && delta < bestDeltaForStrength)
      ) {
        strength = s;
        bestDeltaForStrength = delta;
        bestPay = p;
        mode = "identifier";
      }
    }

    if (strength < 800) {
      mode = "fallback";
      bestPay = pickFallbackByDate(valorMatches, tx.date);
    }

    if (!bestPay) continue;

    const confidence =
      mode === "identifier" && strength >= 800 ? new Prisma.Decimal(0.99) : new Prisma.Decimal(0.95);

    const noteTag =
      mode === "identifier" ?
        `[Pluggy] Conciliação por identificador · ${tx.pluggyTransactionId}`
      : `[Pluggy] Conciliação automática (valor/data) · ${tx.pluggyTransactionId}`;

    try {
      await prisma.$transaction(async (db) => {
        const freshTx = await db.pluggyTransaction.findUnique({
          where: { id: tx.id },
        });
        if (!freshTx || freshTx.reconciledPagamentoId) return;

        const pay = await db.pagamento.findUnique({
          where: { id: bestPay!.id },
        });
        if (
          !pay ||
          pay.status === StatusPagamento.PAGO ||
          pay.status === StatusPagamento.CANCELADO
        ) {
          return;
        }

        await db.pagamento.update({
          where: { id: pay.id },
          data: {
            status: StatusPagamento.PAGO,
            dataPagamento: tx.date,
            metodoPagamento: pay.metodoPagamento ?? "OPEN_FINANCE_PLUGGY",
            observacoes: [pay.observacoes, noteTag].filter(Boolean).join("\n").slice(0, 8000),
          },
        });

        await db.pluggyTransaction.update({
          where: { id: tx.id },
          data: {
            reconciledPagamentoId: pay.id,
            reconciledAt: new Date(),
            reconciliationConfidence: confidence,
          },
        });
      });
      applied += 1;
      pool = pool.filter((x) => x.id !== bestPay!.id);
    } catch {
      /* concorrência / uniq — ignorar */
    }
  }

  return applied;
}
