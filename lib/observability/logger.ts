export type ServerLogLevel = "info" | "warn" | "error";

/**
 * Log estruturado em uma linha (JSON) para agregadores (Datadog, Axiom, etc.).
 * Inclua sempre correlationId e schoolId quando existirem.
 */
export function logStructured(
  level: ServerLogLevel,
  payload: Record<string, unknown>
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    ...payload,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
