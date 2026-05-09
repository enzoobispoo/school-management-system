"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FinanceiroHomeHero } from "@/components/financeiro/financeiro-home-hero";
import { FinancialSummary } from "@/components/financeiro/financial-summary";
import { FinancialSummarySkeleton } from "@/components/financeiro/financial-summary-skeleton";
import { FinancialAuditTrailCard } from "@/components/financeiro/financial-audit-trail-card";
import { DashboardChartsSection } from "@/components/dashboard/charts/dashboard-charts-section";
import { useFinanceiroOverviewData } from "@/hooks/financeiro/use-financeiro-overview-data";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";
import { FinanceiroPluggyPanel } from "@/components/financeiro/financeiro-pluggy-panel";
import { usePluggyOverviewSnapshot } from "@/hooks/financeiro/use-pluggy-overview-snapshot";

export function FinanceiroOverviewContent() {
  const { t } = useDashboardLanguage();
  const pluggySnap = usePluggyOverviewSnapshot();
  const {
    loadingMetricas,
    loadingReports,
    error,
    financialTotals,
    advancedMetrics,
    auditTrail,
    chartData,
  } = useFinanceiroOverviewData();

  return (
    <div className="space-y-6 p-6">
      <FinanceiroHomeHero
        loadingTotals={loadingMetricas}
        recebidoMes={financialTotals.recebidoMes}
        valoresAtrasados={financialTotals.valoresAtrasados}
        quantidadeAtrasados={financialTotals.quantidadeAtrasados}
        valoresPendentes={financialTotals.valoresPendentes}
        quantidadePendentes={financialTotals.quantidadePendentes}
        taxaInadimplencia={advancedMetrics.taxaInadimplencia}
        pluggy={{
          loading: pluggySnap.loading,
          pluggyAllowed: pluggySnap.pluggyAllowed,
          connected: pluggySnap.connected,
          institutionName: pluggySnap.institutionName,
          consolidatedBankBalance: pluggySnap.consolidatedBankBalance,
          lastSyncAt: pluggySnap.lastSyncAt,
          lastSyncError: pluggySnap.lastSyncError,
        }}
      />

      {error ?
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      : null}

      <FinanceiroPluggyPanel />

      {loadingMetricas ?
        <FinancialSummarySkeleton />
      : (
        <FinancialSummary
          receitaTotal={financialTotals.receitaTotal}
          recebidoMes={financialTotals.recebidoMes}
          valoresPendentes={financialTotals.valoresPendentes}
          valoresAtrasados={financialTotals.valoresAtrasados}
          quantidadePendentes={financialTotals.quantidadePendentes}
          quantidadeAtrasados={financialTotals.quantidadeAtrasados}
          receitaPrevista={advancedMetrics.receitaPrevista}
          taxaRecebimento={advancedMetrics.taxaRecebimento}
          taxaInadimplencia={advancedMetrics.taxaInadimplencia}
        />
      )}

      {!loadingMetricas ?
        <FinancialAuditTrailCard items={auditTrail} />
      : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">{t("finance.overview.trendsTitle")}</h2>
            <p className="text-xs text-muted-foreground">{t("finance.overview.trendsSubtitle")}</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" asChild>
            <Link href="/relatorios">
              {t("finance.overview.fullReports")}
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <DashboardChartsSection
          data={chartData}
          loading={loadingReports}
          omitRevenue={false}
        />
      </section>

      <div className="flex justify-center pb-4">
        <Button size="lg" className="rounded-2xl px-8" asChild>
          <Link href="/financeiro/cobrancas">{t("finance.overview.gotoCharges")}</Link>
        </Button>
      </div>
    </div>
  );
}
