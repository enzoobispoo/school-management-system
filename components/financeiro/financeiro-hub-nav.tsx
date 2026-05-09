"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

const TABS = [
  { href: "/financeiro", labelKey: "finance.nav.overview", exact: true },
  { href: "/financeiro/cobrancas", labelKey: "finance.nav.charges", exact: false },
  { href: "/financeiro/contratos", labelKey: "finance.nav.contracts", exact: false },
  { href: "/financeiro/professores", labelKey: "finance.nav.teachers", exact: false },
  { href: "/financeiro/notas", labelKey: "finance.nav.invoices", exact: false },
  { href: "/financeiro/contas-pagar", labelKey: "finance.nav.payables", exact: false },
  { href: "/financeiro/negociacoes", labelKey: "finance.nav.negotiations", exact: false },
  { href: "/financeiro/eduia", labelKey: "finance.nav.ai", exact: false },
] as const;

export function FinanceiroHubNav() {
  const { t } = useDashboardLanguage();
  const pathname = usePathname();
  const tabs = TABS.map(({ labelKey, ...tab }) => ({
    ...tab,
    label: t(labelKey),
  }));

  return (
    <div className="border-b border-border/60 bg-background">
      <nav
        className="flex gap-1 overflow-x-auto px-6 pb-0 pt-1"
        aria-label={t("finance.nav.aria")}
      >
        {tabs.map((tab) => {
          const active =
            tab.exact ?
              pathname === tab.href
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={false}
              className={cn(
                "relative whitespace-nowrap rounded-t-xl px-4 py-2.5 text-[13px] font-medium transition-colors",
                active ?
                  "text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {tab.label}
              {active ?
                <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-primary" />
              : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
