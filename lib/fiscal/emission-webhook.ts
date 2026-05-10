import "server-only";

/**
 * Dispara webhook HTTP para fila de emissão fiscal (NFS-e/NF-e via n8n, Zapier ou microserviço).
 *
 * Env:
 * - FISCAL_EMISSION_WEBHOOK_URL — URL HTTPS que recebe POST JSON
 * - FISCAL_EMISSION_WEBHOOK_SECRET — opcional; enviado em X-Fiscal-Secret
 */
export async function postFiscalEmissionWebhook(payload: Record<string, unknown>): Promise<{
  ok: boolean;
  skipped: boolean;
  status?: number;
}> {
  const url = process.env.FISCAL_EMISSION_WEBHOOK_URL?.trim();
  if (!url) {
    return { ok: false, skipped: true };
  }

  const secret = process.env.FISCAL_EMISSION_WEBHOOK_SECRET?.trim();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { "X-Fiscal-Secret": secret } : {}),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(45_000),
  });

  return { ok: res.ok, skipped: false, status: res.status };
}
