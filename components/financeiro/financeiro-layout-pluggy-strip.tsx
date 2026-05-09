"use client";

import { usePathname } from "next/navigation";
import { PluggyReflectBanner } from "@/components/financeiro/pluggy-reflect-banner";

/** Banner só nas sub-rotas de `/financeiro/*`; na overview já há hero + painel Pluggy. */
export function FinanceiroLayoutPluggyStrip() {
  const pathname = usePathname() ?? "";
  if (pathname === "/financeiro") return null;
  return (
    <div className="border-b border-border/40 bg-background/80 px-4 pb-3 pt-3 md:px-6">
      <PluggyReflectBanner />
    </div>
  );
}
