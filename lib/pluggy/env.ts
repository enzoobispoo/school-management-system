import "server-only";

/**
 * Variáveis obrigatórias em produção:
 * - PLUGGY_CLIENT_ID / PLUGGY_CLIENT_SECRET
 * - PLUGGY_CREDENTIALS_ENCRYPTION_KEY: base64 de 32 bytes (AES-256-GCM), para envelope cifrado por conexão
 * Opcional: NEXT_PUBLIC_APP_URL (webhook), PLUGGY_TRANSACTION_LOOKBACK_DAYS (padrão 365)
 */
export function getPluggyClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.PLUGGY_CLIENT_ID?.trim();
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("PLUGGY_CLIENT_ID and PLUGGY_CLIENT_SECRET must be set.");
  }
  return { clientId, clientSecret };
}

/** Base URL pública do app (webhook / OAuth redirect). */
export function getPublicAppBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "";
}

export function pluggyWebhookUrl(): string | undefined {
  const base = getPublicAppBaseUrl();
  if (!base) return undefined;
  return `${base}/api/webhooks/pluggy`;
}

export function pluggyTransactionLookbackDays(): number {
  const raw = process.env.PLUGGY_TRANSACTION_LOOKBACK_DAYS?.trim();
  const n = raw ? Number(raw) : 365;
  return Number.isFinite(n) && n > 0 && n <= 730 ? Math.floor(n) : 365;
}
