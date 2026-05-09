/** Slugs persistidos em `EscolaSettings.payoutBankSlug` (plano Full). */
export const PAYOUT_BANK_SLUGS = [
  "itau",
  "bradesco",
  "bb",
  "santander",
  "caixa",
  "nubank",
  "inter",
  "c6",
  "sicredi",
  "sicoob",
  "original",
  "mercadopago",
  "stone",
  "pagbank",
  "outro",
] as const;

export type PayoutBankSlug = (typeof PAYOUT_BANK_SLUGS)[number];

export function isPayoutBankSlug(value: string): value is PayoutBankSlug {
  return (PAYOUT_BANK_SLUGS as readonly string[]).includes(value);
}
