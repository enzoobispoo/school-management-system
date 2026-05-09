"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import type {
  DashboardMetricKey,
  OptionalMetricKey,
} from "./dashboard-metric-card-config";
import { OPTIONAL_METRIC_CARDS } from "./dashboard-metric-card-config";
import { Button } from "@/components/ui/button";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

interface DashboardCustomizePanelProps {
  optionalCards: Record<OptionalMetricKey, boolean>;
  cardsOrder: DashboardMetricKey[];
  onToggleCard: (key: OptionalMetricKey, checked: boolean) => void;
  onMoveUp: (key: DashboardMetricKey) => void;
  onMoveDown: (key: DashboardMetricKey) => void;
}

export function DashboardCustomizePanel({
  optionalCards,
  cardsOrder,
  onToggleCard,
  onMoveUp,
  onMoveDown,
}: DashboardCustomizePanelProps) {
  const { t } = useDashboardLanguage();
  const optionalCardsInOrder = cardsOrder.filter(
    (key): key is OptionalMetricKey =>
      OPTIONAL_METRIC_CARDS.some((item) => item.key === key)
  );

  return (
    <div className="mb-6 rounded-2xl border border-border/60 bg-white/5 backdrop-blur-md p-4 dark:bg-white/[0.03]">
      <p className="text-sm font-medium text-foreground">{t("customize.title")}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("customize.description")}
      </p>

      <div className="mt-4 space-y-3">
        {optionalCardsInOrder.map((key, index) => {
          const item = OPTIONAL_METRIC_CARDS.find((card) => card.key === key);
          if (!item) return null;

          const isFirst = index === 0;
          const isLast = index === optionalCardsInOrder.length - 1;

          return (
            <div
              key={key}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-white/5 backdrop-blur-sm px-4 py-3 dark:bg-white/[0.03]"
            >
              <label className="flex min-w-0 items-center gap-3">
                <input
                  type="checkbox"
                  checked={optionalCards[key]}
                  onChange={(e) => onToggleCard(key, e.target.checked)}
                />
                <span className="truncate text-sm text-foreground">
                  {t(`metric.${item.key}.title`)}
                </span>
              </label>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-xl"
                  onClick={() => onMoveUp(key)}
                  disabled={isFirst}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-xl"
                  onClick={() => onMoveDown(key)}
                  disabled={isLast}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}