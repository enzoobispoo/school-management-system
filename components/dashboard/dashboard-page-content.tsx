"use client";

import { useState } from "react";
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
import type { DashboardMetricsView } from "@/components/dashboard/metrics/dashboard-metric-card-config";
import { ChargeStudentsModal } from "@/components/dashboard/modals/charge-students-modal";

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
}

export function DashboardPageContent({
  data,
  loading,
  error,
  metrics,
  recentActivities,
  insights,
}: DashboardPageContentProps) {
  const [showSettings, setShowSettings] = useState(false);

  const {
    optionalCards,
    cardsOrder,
    toggleCard,
    moveCardUp,
    moveCardDown,
    loadingPreferences,
  } = useDashboardCardsPreferences();

  const { dismissInsight, visibleInsights, loadingInsightsPreferences } =
    useDashboardInsightsPreferences(insights);

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="mt-8 space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            Painel da escola
          </p>
          <p className="text-sm text-muted-foreground">
            Visão executiva para alto volume: prioridades primeiro, depois indicadores e histórico.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-xl"
          onClick={() => setShowSettings((prev) => !prev)}
        >
          <Settings2 className="mr-2 h-4 w-4" />
          Personalizar indicadores
        </Button>
      </div>

      {showSettings && (
        <DashboardCustomizePanel
          optionalCards={optionalCards}
          cardsOrder={cardsOrder}
          onToggleCard={toggleCard}
          onMoveUp={moveCardUp}
          onMoveDown={moveCardDown}
        />
      )}

      <DashboardInsightsSection
        insights={visibleInsights}
        loading={loading || loadingPreferences || loadingInsightsPreferences}
        onDismiss={dismissInsight}
      />

      <DashboardCommandCenter metrics={metrics} loading={loading} />

      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Indicadores principais
          </h3>
          <p className="text-xs text-muted-foreground">
            Números consolidados da sua escola (personalize quais cartões aparecem acima).
          </p>
        </div>
        <DashboardMetricsGrid
          metrics={metrics}
          optionalCards={optionalCards}
          cardsOrder={cardsOrder}
          loading={loading || loadingPreferences}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Tendências e distribuição
          </h3>
          <p className="text-xs text-muted-foreground">
            Receita ao longo do tempo e alunos por curso.
          </p>
        </div>
        <DashboardChartsSection data={data} loading={loading} />
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Movimentação recente
          </h3>
          <p className="text-xs text-muted-foreground">
            Últimos eventos registrados pelo sistema.
          </p>
        </div>
        <DashboardActivitySection recentActivities={recentActivities} loading={loading} />
      </section>

      <ChargeStudentsModal />
    </div>
  );
}
