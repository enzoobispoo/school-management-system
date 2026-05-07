"use client";

import { AiAssistantPanel } from "@/components/dashboard/ai/ai-assistant-panel";
import type { DashboardMetricsView } from "@/components/dashboard/metrics/dashboard-metric-card-config";

interface DashboardRightPanelProps {
  initialPrompt?: string;
  dashboardMetrics?: DashboardMetricsView | null;
  dashboardMetricsLoading?: boolean;
  dashboardMetricsError?: boolean;
}

export function DashboardRightPanel({
  initialPrompt = "",
  dashboardMetrics = null,
  dashboardMetricsLoading = false,
  dashboardMetricsError = false,
}: DashboardRightPanelProps) {
  return (
    <aside className="sticky top-20 z-10 flex h-[calc(100dvh-6rem)] flex-col overflow-hidden rounded-xl border border-border/60 bg-card p-3 text-card-foreground shadow-sm">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-foreground">EduIA · Copiloto</h3>
        <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          Beta
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <AiAssistantPanel
          embedded
          initialPrompt={initialPrompt}
          dashboardMetrics={dashboardMetrics}
          dashboardMetricsLoading={dashboardMetricsLoading}
          dashboardMetricsError={dashboardMetricsError}
        />
      </div>
    </aside>
  );
}