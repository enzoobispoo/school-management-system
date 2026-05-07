import { NextResponse } from "next/server";
import type { RateLimitResult } from "@/lib/security/rate-limit";

export function jsonTooManyRequests(result: Extract<RateLimitResult, { ok: false }>) {
  return NextResponse.json(
    {
      error: "Muitas tentativas. Aguarde um momento e tente novamente.",
      retryAfterSec: result.retryAfterSec,
    },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSec) },
    }
  );
}
