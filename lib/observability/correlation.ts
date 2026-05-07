import { NextRequest, NextResponse } from "next/server";

export const CORRELATION_HEADER = "x-correlation-id";

export function readCorrelationIdFromRequest(request: NextRequest): string {
  const existing =
    request.headers.get(CORRELATION_HEADER)?.trim() ||
    request.headers.get("x-request-id")?.trim();
  return existing || crypto.randomUUID();
}

function mergedRequestHeaders(request: NextRequest, correlationId: string) {
  const headers = new Headers(request.headers);
  headers.set(CORRELATION_HEADER, correlationId);
  return headers;
}

/** Propaga o correlation id para handlers downstream (App Router / Route Handlers). */
export function continueRequestWithCorrelation(
  request: NextRequest,
  correlationId: string
) {
  return NextResponse.next({
    request: { headers: mergedRequestHeaders(request, correlationId) },
  });
}

export function withCorrelationHeader(
  response: NextResponse,
  correlationId: string
): NextResponse {
  response.headers.set(CORRELATION_HEADER, correlationId);
  return response;
}
