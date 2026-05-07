import type { PrismaClient } from "@prisma/client";

/**
 * Após alterar o schema, é obrigatório `npx prisma generate` e reiniciar o `next dev`.
 * O singleton global em `lib/prisma.ts` pode ficar preso a um bundle antigo até reinício.
 */
export function trocaProfessorPropostaDelegate<T extends PrismaClient>(
  prisma: T
): T["trocaProfessorProposta"] | null {
  const d = (
    prisma as unknown as { trocaProfessorProposta?: T["trocaProfessorProposta"] }
  ).trocaProfessorProposta;
  if (!d || typeof d.count !== "function") return null;
  return d;
}

export const TROCA_PRISMA_STALE_MESSAGE =
  "Base de código desatualizada: execute `npx prisma generate` e reinicie o servidor de desenvolvimento.";

export class TrocaPrismaStaleError extends Error {
  constructor() {
    super(TROCA_PRISMA_STALE_MESSAGE);
    this.name = "TrocaPrismaStaleError";
  }
}
