"use client";

import { AiAssistantPanel } from "@/components/dashboard/ai/ai-assistant-panel";
import { EduiaPanelShell } from "@/components/dashboard/ai/eduia-panel-shell";
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
    <EduiaPanelShell layout="sidebar" chrome="full">
      <AiAssistantPanel
        embedded
        initialPrompt={initialPrompt}
        dashboardMetrics={dashboardMetrics}
        dashboardMetricsLoading={dashboardMetricsLoading}
        dashboardMetricsError={dashboardMetricsError}
      />
    </EduiaPanelShell>
  );
}