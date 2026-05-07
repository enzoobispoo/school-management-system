import { createHash } from "node:crypto";

/** SHA-256 hex do token enviado por e-mail — não armazene o token em texto puro no banco. */
export function hashPasswordResetToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}
