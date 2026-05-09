/**
 * Extrai o TXID (tag 62 → subcampo 05) do payload BR Code PIX (copia e cola).
 * @see Manual BR Code / PIX — Additional Data Field Template (62), TXID (05).
 */

function parseTlvTwoDigitIds(payload: string): { id: string; value: string }[] {
  const out: { id: string; value: string }[] = [];
  let i = 0;
  while (i + 4 <= payload.length) {
    const id = payload.slice(i, i + 2);
    const len = Number.parseInt(payload.slice(i + 2, i + 4), 10);
    if (!Number.isFinite(len) || len < 0 || i + 4 + len > payload.length) break;
    const value = payload.slice(i + 4, i + 4 + len);
    out.push({ id, value });
    i += 4 + len;
  }
  return out;
}

/** Primeiro TXID encontrado no template 62 (subcampo 05). */
export function extractPixTxIdFromBrCode(payload: string | null | undefined): string | null {
  if (!payload?.trim()) return null;
  const trimmed = payload.trim();
  const root = parseTlvTwoDigitIds(trimmed);
  for (const { id, value } of root) {
    if (id !== "62") continue;
    const inner = parseTlvTwoDigitIds(value);
    for (const sub of inner) {
      if (sub.id === "05" && sub.value.length >= 1 && sub.value.length <= 25) {
        return sub.value;
      }
    }
  }
  return null;
}

/** Lista única de TXIDs derivados do BR Code (um ou mais templates 62 raros). */
export function extractPixTxIdsFromBrCodes(
  ...payloads: Array<string | null | undefined>
): string[] {
  const ids = new Set<string>();
  for (const p of payloads) {
    const one = extractPixTxIdFromBrCode(p);
    if (one) ids.add(one);
  }
  return [...ids];
}
