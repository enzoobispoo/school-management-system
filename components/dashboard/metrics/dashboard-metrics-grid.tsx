"use client";

import { MetricCard } from "@/components/dashboard/metric-card";
import { DashboardMetricCardSkeleton } from "@/components/dashboard/skeletons/dashboard-metric-card-skeleton";
import {
  FIXED_METRIC_CARDS,
  METRIC_CARD_CONFIG,
  METRIC_CARD_ICON_COLOR,
  type DashboardMetricsView,
  type DashboardMetricKey,
  type OptionalMetricKey,
} from "./dashboard-metric-card-config";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

interface DashboardMetricsGridProps {
  metrics: DashboardMetricsView;
  optionalCards: Record<OptionalMetricKey, boolean>;
  cardsOrder: DashboardMetricKey[];
  loading: boolean;
  /** Oculta cartões (ex.: secretaria sem métricas financeiras agregadas). */
  excludeMetricKeys?: readonly DashboardMetricKey[];
}

function getMetricValue(
  key: DashboardMetricKey,
  metrics: DashboardMetricsView
): string {
  switch (key) {
    case "totalAlunos":
      return metrics.totalAlunos;
    case "matriculasAtivas":
      return metrics.matriculasAtivas;
    case "receitaMensal":
      return metrics.receitaMensal;
    case "pagamentosAtrasados":
      return metrics.pagamentosAtrasados;
    case "trocasProfessorNoMes":
      return metrics.trocasProfessorNoMes;
    case "novosAlunosNoMes":
      return metrics.novosAlunosNoMes;
    case "turmasAtivas":
      return metrics.turmasAtivas;
    case "turmasLotadas":
      return metrics.turmasLotadas;
    case "turmasComVagasOciosas":
      return metrics.turmasComVagasOciosas;
    case "professoresInativos":
      return metrics.professoresInativos;
    case "notificacoesNaoLidas":
      return metrics.notificacoesNaoLidas;
    case "receitaPrevistaMes":
      return metrics.receitaPrevistaMes;
  }
}

function getVariationText(
  value: number,
  t: (key: string, vars?: Record<string, string | number>) => string
) {
  if (value > 0) return t("metric.variation.up", { pct: value });
  if (value < 0)
    return t("metric.variation.down", { pct: Math.abs(value) });
  return t("metric.variation.none");
}

function getVariationType(
  value: number
): "positive" | "negative" | "neutral" {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function metricTitleKey(key: DashboardMetricKey): string {
  return `metric.${key}.title`;
}

function metricChangeKey(key: DashboardMetricKey): string {
  return `metric.${key}.change`;
}

export function DashboardMetricsGrid({
  metrics,
  optionalCards,
  cardsOrder,
  loading,
  excludeMetricKeys,
}: DashboardMetricsGridProps) {
  const { t } = useDashboardLanguage();

  function renderMetricCard(key: DashboardMetricKey) {
    const config = METRIC_CARD_CONFIG[key];
    const title = t(metricTitleKey(key));

    if (key === "pagamentosAtrasados") {
      return (
        <MetricCard
          key={key}
          title={title}
          value={metrics.pagamentosAtrasados}
          change={t("metric.pagamentosAtrasados.overdueLine", {
            n: metrics.quantidadePagamentosAtrasados,
          })}
          changeType={config.changeType}
          secondaryInfo={t("metric.pagamentosAtrasados.pendingLine", {
            n: metrics.quantidadePagamentosPendentes,
          })}
          icon={config.icon}
          iconColor={METRIC_CARD_ICON_COLOR}
          href={config.href}
        />
      );
    }

    if (key === "receitaMensal") {
      return (
        <MetricCard
          key={key}
          title={title}
          value={metrics.receitaMensal}
          change={getVariationText(metrics.receitaMensalVariacao, t)}
          changeType={getVariationType(metrics.receitaMensalVariacao)}
          icon={config.icon}
          iconColor={METRIC_CARD_ICON_COLOR}
          href={config.href}
        />
      );
    }

    if (key === "novosAlunosNoMes") {
      return (
        <MetricCard
          key={key}
          title={title}
          value={metrics.novosAlunosNoMes}
          change={getVariationText(metrics.novosAlunosVariacao, t)}
          changeType={getVariationType(metrics.novosAlunosVariacao)}
          icon={config.icon}
          iconColor={METRIC_CARD_ICON_COLOR}
          href={config.href}
        />
      );
    }

    if (key === "trocasProfessorNoMes") {
      return (
        <MetricCard
          key={key}
          title={title}
          value={metrics.trocasProfessorNoMes}
          change={getVariationText(metrics.trocasProfessorVariacao, t)}
          changeType={getVariationType(metrics.trocasProfessorVariacao)}
          icon={config.icon}
          iconColor={METRIC_CARD_ICON_COLOR}
          href={config.href}
        />
      );
    }

    const value = getMetricValue(key, metrics);
    const change =
      "change" in config && config.change ?
        t(metricChangeKey(key))
      : undefined;

    return (
      <MetricCard
        key={key}
        title={title}
        value={value}
        change={change}
        changeType={config.changeType}
        icon={config.icon}
        iconColor={METRIC_CARD_ICON_COLOR}
        href={config.href}
      />
    );
  }

  const exclude = excludeMetricKeys ?
      new Set<DashboardMetricKey>(excludeMetricKeys)
    : null;

  const visibleKeys = cardsOrder.filter((key) => {
    if (exclude?.has(key)) return false;
    if ((FIXED_METRIC_CARDS as readonly DashboardMetricKey[]).includes(key))
      return true;
    return optionalCards[key as OptionalMetricKey];
  });

  const totalVisibleCards = visibleKeys.length;

  const gridClassName =
    totalVisibleCards <= 4
      ? "grid gap-3 md:grid-cols-2 md:gap-4"
      : totalVisibleCards === 5
        ? "grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3"
        : "grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3 2xl:grid-cols-4";

  return (
    <div className={gridClassName}>
      {loading
        ? Array.from({ length: totalVisibleCards }).map((_, index) => (
            <DashboardMetricCardSkeleton key={`metric-skeleton-${index}`} />
          ))
        : visibleKeys.map((key) => renderMetricCard(key))}
    </div>
  );
}
