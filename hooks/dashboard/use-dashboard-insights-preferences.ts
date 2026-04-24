"use client";

import { useEffect, useMemo, useState } from "react";

type InsightTone = "positive" | "negative" | "warning" | "neutral";

export interface DashboardInsightItem {
  id: string;
  tone: InsightTone;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

type InsightFrequency = "daily" | "weekly" | "biweekly" | "monthly";

const DEFAULT_FREQUENCY: InsightFrequency = "weekly";

function getThresholdMs(frequency: InsightFrequency) {
  switch (frequency) {
    case "daily":
      return 1 * 24 * 60 * 60 * 1000;
    case "weekly":
      return 7 * 24 * 60 * 60 * 1000;
    case "biweekly":
      return 15 * 24 * 60 * 60 * 1000;
    case "monthly":
      return 30 * 24 * 60 * 60 * 1000;
  }
}

function shouldShowInsight(
  insightId: string,
  dismissed: Record<string, string>,
  frequency: InsightFrequency
) {
  const dismissedAt = dismissed[insightId];
  if (!dismissedAt) return true;

  const dismissedTime = new Date(dismissedAt).getTime();
  if (Number.isNaN(dismissedTime)) return true;

  return Date.now() - dismissedTime >= getThresholdMs(frequency);
}

export function useDashboardInsightsPreferences(
  insights: DashboardInsightItem[]
) {
  const [frequency, setFrequency] = useState<InsightFrequency>(DEFAULT_FREQUENCY);
  const [enabled, setEnabled] = useState(true);
  const [limit, setLimit] = useState(3);
  const [dismissed, setDismissed] = useState<Record<string, string>>({});
  const [loadingInsightsPreferences, setLoadingInsightsPreferences] =
    useState(true);

  useEffect(() => {
    async function loadPreferences() {
      try {
        setLoadingInsightsPreferences(true);

        const response = await fetch("/api/users/me/dashboard-insights", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Falha ao carregar preferências dos insights");
        }

        const result = await response.json();

        setFrequency((result?.frequency as InsightFrequency) ?? DEFAULT_FREQUENCY);
        setEnabled(result?.enabled ?? true);
        setLimit(result?.limit ?? 3);
        setDismissed(
          result?.dismissed && typeof result.dismissed === "object"
            ? result.dismissed
            : {}
        );
      } catch (error) {
        console.error("Erro ao carregar preferências dos insights:", error);
      } finally {
        setLoadingInsightsPreferences(false);
      }
    }

    loadPreferences();
  }, []);

  async function dismissInsight(insightId: string) {
    const next = {
      ...dismissed,
      [insightId]: new Date().toISOString(),
    };

    setDismissed(next);

    try {
      await fetch("/api/users/me/dashboard-insights", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ insightId }),
      });
    } catch (error) {
      console.error("Erro ao dispensar insight:", error);
    }
  }

  const visibleInsights = useMemo(() => {
    if (!enabled) return [];

    return insights
      .filter((insight) => shouldShowInsight(insight.id, dismissed, frequency))
      .slice(0, limit);
  }, [insights, dismissed, frequency, enabled, limit]);

  return {
    frequency,
    enabled,
    limit,
    dismissInsight,
    visibleInsights,
    loadingInsightsPreferences,
  };
}