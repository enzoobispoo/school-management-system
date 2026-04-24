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
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => setShowSettings((prev) => !prev)}
        >
          <Settings2 className="mr-2 h-4 w-4" />
          Personalizar dashboard
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

      <DashboardMetricsGrid
        metrics={metrics}
        optionalCards={optionalCards}
        cardsOrder={cardsOrder}
        loading={loading || loadingPreferences}
      />

      <DashboardChartsSection data={data} loading={loading} />

      <DashboardActivitySection
        recentActivities={recentActivities}
        loading={loading}
      />

<ChargeStudentsModal />
    </div>
  );
}
