"use client";

import Link from "next/link";
import { AlertTriangle, Info, TrendingDown, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InsightItem {
  id: string;
  tone: "positive" | "negative" | "warning" | "neutral";
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

interface DashboardInsightsSectionProps {
  insights?: InsightItem[];
  loading: boolean;
  onDismiss?: (insightId: string) => void;
}

function getInsightIcon(tone: InsightItem["tone"]) {
  switch (tone) {
    case "positive":
      return TrendingUp;
    case "negative":
      return TrendingDown;
    case "warning":
      return AlertTriangle;
    case "neutral":
      return Info;
  }
}

function getInsightClasses(tone: InsightItem["tone"]) {
  switch (tone) {
    case "positive":
      return "border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200";
    case "negative":
      return "border-red-200 bg-red-50/70 text-red-900 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200";
    case "warning":
      return "border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200";
    case "neutral":
      return "border-border/60 bg-card text-foreground";
  }
}

export function DashboardInsightsSection({
  insights = [],
  loading,
  onDismiss,
}: DashboardInsightsSectionProps) {
  if (loading) {
    return (
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-2xl border border-border/60 bg-card p-5"
          >
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="mt-3 h-3 w-full rounded bg-muted" />
            <div className="mt-2 h-3 w-4/5 rounded bg-muted" />
            <div className="mt-4 h-9 w-32 rounded-xl bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (!insights.length) {
    return null;
  }

  return (
    <div className="mb-6 grid gap-4 lg:grid-cols-2">
      {insights.map((insight) => {
        const Icon = getInsightIcon(insight.tone);

        return (
          <div
            key={insight.id}
            className={`relative rounded-2xl border p-5 ${getInsightClasses(
              insight.tone
            )}`}
          >
            {onDismiss ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-3 top-3 h-8 w-8 rounded-xl opacity-70 hover:opacity-100"
                onClick={() => onDismiss(insight.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}

            <div className="flex items-start gap-3 pr-10">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-background/70 dark:bg-background/20">
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{insight.title}</p>
                <p className="mt-1 text-sm opacity-90">{insight.description}</p>

                {insight.action ? (
                  <div className="mt-4">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-xl border border-black/10 bg-black text-white hover:bg-black/90 dark:border-white/10 dark:bg-white dark:text-black dark:hover:bg-white/90"
                      onClick={() => {
                        if (
                          insight.action?.href === "/financeiro?tab=overdue"
                        ) {
                          window.dispatchEvent(
                            new CustomEvent("openChargeStudentsModal")
                          );
                        } else {
                          window.location.href = insight.action?.href || "/";
                        }
                      }}
                    >
                      {insight.action?.label}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
