type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function pruneExpired(now: number) {
  if (buckets.size < 8000) return;
  for (const [key, b] of buckets) {
    if (now >= b.resetAt) buckets.delete(key);
  }
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

/**
 * Limite fixo por janela (melhor em um único processo; em serverless multi-instância use Redis/Upstash).
 */
export function rateLimitOrFail(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  pruneExpired(now);

  const existing = buckets.get(key);
  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { ok: true };
}
