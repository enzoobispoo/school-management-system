import { Prisma } from "@prisma/client";

const SCHEMA_DRIFT_CODES = new Set(["P2021", "P2022"]);

export function isPrismaSchemaDriftError(
  e: unknown
): e is Prisma.PrismaClientKnownRequestError {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    SCHEMA_DRIFT_CODES.has(e.code)
  );
}

export const PRISMA_MIGRATE_HINT_PT =
  "O banco está desatualizado em relação ao código. Execute `npx prisma migrate deploy` (dev: `npx prisma migrate dev`) e reinicie o `next dev`.";
