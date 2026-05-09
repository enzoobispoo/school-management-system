"use client";

import { useMemo, useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { DashboardInsightsSection } from "@/components/dashboard/insights/dashboard-insights-section";
import { DashboardMetricsGrid } from "@/components/dashboard/metrics/dashboard-metrics-grid";
import { DashboardCustomizePanel } from "@/components/dashboard/metrics/dashboard-customize-panel";
import { DashboardChartsSection } from "@/components/dashboard/charts/dashboard-charts-section";
import { DashboardActivitySection } from "@/components/dashboard/activity/dashboard-activity-section";
import { DashboardCommandCenter } from "@/components/dashboard/dashboard-command-center";
import { useDashboardCardsPreferences } from "@/hooks/dashboard/use-dashboard-cards-preferences";
import {
  useDashboardInsightsPreferences,
  type DashboardInsightItem,
} from "@/hooks/dashboard/use-dashboard-insights-preferences";
import type {
  DashboardMetricsView,
  DashboardMetricKey,
} from "@/components/dashboard/metrics/dashboard-metric-card-config";
import { ChargeStudentsModal } from "@/components/dashboard/modals/charge-students-modal";
import { PluggyReflectBanner } from "@/components/financeiro/pluggy-reflect-banner";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

export type DashboardPageAudience =
  | "executive"
  | "secretaria"
  /** Mesmo hub /secretaria; indicadores e gráficos incluem visão de cobrança (sem cobrança em massa no modal). */
  | "secretaria_financeira";

/** Insights que citam receita/cobrança — não exibidos na visão secretaria. */
const SECRETARIA_BLOCKED_INSIGHT_IDS = new Set([
  "receita-alta",
  "receita-baixa",
  "pagamentos-atrasados",
]);

const SECRETARIA_EXCLUDED_METRICS: readonly DashboardMetricKey[] = [
  "receitaMensal",
  "pagamentosAtrasados",
  "receitaPrevistaMes",
];

interface DashboardPageContentProps {
  data: {
    receitaAoLongoDoTempo: Array<{
      month: string;
      receita: number;
    }>;
    alunosPorCurso: Array<{
      curso: string;
      alunos: number;
    }>;
  } | null;
  loading: boolean;
  error: string;
  metrics: DashboardMetricsView;
  recentActivities: Array<{
    id: string;
    type: "enrollment" | "payment" | "new_student";
    name: string;
    description: string;
    time: string;
    initials: string;
  }>;
  insights: DashboardInsightItem[];
  /** Secretaria acadêmica vs secretaria com métricas financeiras no painel. */
  audience?: DashboardPageAudience;
}

export function DashboardPageContent({
  data,
  loading,
  error,
  metrics,
  recentActivities,
  insights,
  audience = "executive",
}: DashboardPageContentProps) {
  const { t } = useDashboardLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const isSecretariaAcademicOnly = audience === "secretaria";
  const isSecretariaFinance = audience === "secretaria_financeira";
  const showCustomizeIndicators =
    audience === "executive" || isSecretariaFinance;
  const showChargeStudentsModal = audience === "executive";

  const insightsForViewer = useMemo(() => {
    if (!isSecretariaAcademicOnly) return insights;
    return insights.filter((i) => !SECRETARIA_BLOCKED_INSIGHT_IDS.has(i.id));
  }, [insights, isSecretariaAcademicOnly]);

  const activitiesForViewer = useMemo(() => {
    if (!isSecretariaAcademicOnly) return recentActivities;
    return recentActivities.filter((a) => a.type !== "payment");
  }, [recentActivities, isSecretariaAcademicOnly]);

  const {
    optionalCards,
    cardsOrder,
    toggleCard,
    moveCardUp,
    moveCardDown,
    loadingPreferences,
  } = useDashboardCardsPreferences();

  const { dismissInsight, visibleInsights, loadingInsightsPreferences } =
    useDashboardInsightsPreferences(insightsForViewer);

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="mt-8 space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            {isSecretariaAcademicOnly || isSecretariaFinance ?
              t("dashboard.panelEyebrow.secretaria")
            : t("dashboard.panelEyebrow.school")}
          </p>
          <p className="text-sm text-muted-foreground">
            {isSecretariaAcademicOnly ?
              t("dashboard.panelIntro.secretariaAcademic")
            : isSecretariaFinance ?
              t("dashboard.panelIntro.secretariaFinance")
            : t("dashboard.panelIntro.executive")}
          </p>
        </div>
        {showCustomizeIndicators ?
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 rounded-xl"
            onClick={() => setShowSettings((prev) => !prev)}
          >
            <Settings2 className="mr-2 h-4 w-4" />
            {t("dashboard.customizeIndicators")}
          </Button>
        : null}
      </div>

      {showCustomizeIndicators && showSettings ?
        <DashboardCustomizePanel
          optionalCards={optionalCards}
          cardsOrder={cardsOrder}
          onToggleCard={toggleCard}
          onMoveUp={moveCardUp}
          onMoveDown={moveCardDown}
        />
      : null}

      <DashboardInsightsSection
        insights={visibleInsights}
        loading={loading || loadingPreferences || loadingInsightsPreferences}
        onDismiss={dismissInsight}
        allowChargeStudentsShortcut={audience === "executive"}
      />

      <PluggyReflectBanner />

      <DashboardCommandCenter
        metrics={metrics}
        loading={loading}
        variant={isSecretariaAcademicOnly ? "secretaria" : "default"}
      />

      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {t("dashboard.section.metricsTitle")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isSecretariaAcademicOnly ?
              t("dashboard.section.metricsHint.secretaria")
            : isSecretariaFinance ?
              t("dashboard.section.metricsHint.secf")
            : t("dashboard.section.metricsHint.exec")}
          </p>
        </div>
        <DashboardMetricsGrid
          metrics={metrics}
          optionalCards={optionalCards}
          cardsOrder={cardsOrder}
          loading={loading || loadingPreferences}
          excludeMetricKeys={
            isSecretariaAcademicOnly ? SECRETARIA_EXCLUDED_METRICS : undefined
          }
        />
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {isSecretariaAcademicOnly ?
              t("dashboard.section.chartsTitle.secretaria")
            : t("dashboard.section.chartsTitle.default")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isSecretariaAcademicOnly ?
              t("dashboard.section.chartsHint.secretaria")
            : t("dashboard.section.chartsHint.default")}
          </p>
        </div>
        <DashboardChartsSection
          data={data}
          loading={loading}
          omitRevenue={isSecretariaAcademicOnly}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {t("dashboard.section.activityTitle")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isSecretariaAcademicOnly ?
              t("dashboard.section.activityHint.secretaria")
            : isSecretariaFinance ?
              t("dashboard.section.activityHint.secf")
            : t("dashboard.section.activityHint.exec")}
          </p>
        </div>
        <DashboardActivitySection
          recentActivities={activitiesForViewer}
          loading={loading}
        />
      </section>

      {showChargeStudentsModal ? <ChargeStudentsModal /> : null}
    </div>
  );
}
