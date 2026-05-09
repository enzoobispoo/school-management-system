"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { enUS, es, ptBR } from "date-fns/locale";
import { ArrowRight, Building2 } from "lucide-react";
import {
  dashboardLocaleTag,
  useDashboardLanguage,
  type DashboardLanguage,
} from "@/lib/i18n/dashboard-language";
import { usePluggyOverviewSnapshot } from "@/hooks/financeiro/use-pluggy-overview-snapshot";
import { Skeleton } from "@/components/ui/skeleton";

function dfnsLocale(lang: DashboardLanguage) {
  if (lang === "en") return enUS;
  if (lang === "es") return es;
  return ptBR;
}

function formatMoney(value: number, language: DashboardLanguage): string {
  return new Intl.NumberFormat(dashboardLocaleTag(language), {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Mostra saldo / estado da conta Pluggy no dashboard (gestão),
 * espelhando o que está salvo após sync — mesmo conjunto de dados do Financeiro.
 */
export function PluggyReflectBanner() {
  const { t, language } = useDashboardLanguage();
  const snap = usePluggyOverviewSnapshot();

  if (snap.loading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/40 px-4 py-4 dark:bg-card/25">
        <Skeleton className="h-4 w-40 rounded-md" />
        <Skeleton className="mt-3 h-8 w-56 rounded-md" />
        <Skeleton className="mt-2 h-3 w-full max-w-md rounded-md" />
      </div>
    );
  }

  if (!snap.pluggyAllowed || snap.fetchFailed) return null;

  const locale = dfnsLocale(language);

  return (
    <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-muted/35 via-card/90 to-background px-4 py-4 shadow-sm dark:from-muted/15 dark:via-card/50">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/[0.05] dark:bg-muted">
            <Building2 className="h-5 w-5 text-foreground/80" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
              {t("finance.pluggy.reflect.dashboardEyebrow")}
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
              {snap.connected ?
                snap.consolidatedBankBalance != null ?
                  formatMoney(snap.consolidatedBankBalance, language)
                : "—"
              : t("finance.pluggy.reflect.notLinked")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {snap.connected ?
                <>
                  {snap.institutionName ?
                    `${t("finance.pluggy.institution")}: ${snap.institutionName}. `
                  : null}
                  {snap.lastSyncError ?
                    t("finance.pluggy.statusError")
                  : snap.lastSyncAt ?
                    `${t("finance.pluggy.lastSync")}: ${formatDistanceToNow(snap.lastSyncAt, { addSuffix: true, locale })}.`
                  : t("finance.pluggy.neverSynced")}
                  {snap.unreconciledCredits > 0 ?
                    ` ${t("finance.pluggy.reflect.pendConc", { count: String(snap.unreconciledCredits) })}`
                  : null}
                </>
              : t("finance.pluggy.reflect.dashboardConnect")}
            </p>
          </div>
        </div>
        <Link
          href="/financeiro"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted/60 dark:bg-background/40"
        >
          {t("finance.pluggy.reflect.dashboardOpen")}
          <ArrowRight className="h-3.5 w-3.5 opacity-70" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
