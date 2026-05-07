import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const REVAL_SECONDS =
  process.env.NODE_ENV === "development" ? 60 : 3600;

/**
 * Evita tempestade de queries ao root layout durante `next dev` (vários renders/HMR).
 * Mantém o mesmo comportamento anterior (primeira linha de EscolaSettings).
 */
export const getCachedLayoutBrandPrimary = unstable_cache(
  async () => {
    const settings = await prisma.escolaSettings.findFirst().catch(() => null);
    return settings?.corPrimaria ?? "#111111";
  },
  ["root-layout-brand-primary"],
  { revalidate: REVAL_SECONDS }
);
