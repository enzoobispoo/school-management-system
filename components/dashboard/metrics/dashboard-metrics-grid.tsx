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

interface DashboardMetricsGridProps {
  metrics: DashboardMetricsView;
  optionalCards: Record<OptionalMetricKey, boolean>;
  cardsOrder: DashboardMetricKey[];
  loading: boolean;
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

function getVariationText(value: number) {
  if (value > 0) return `↑ +${value}% vs mês passado`;
  if (value < 0) return `↓ ${value}% vs mês passado`;
  return "Sem variação vs mês passado";
}

function getVariationType(
  value: number
): "positive" | "negative" | "neutral" {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function renderMetricCard(
  key: DashboardMetricKey,
  metrics: DashboardMetricsView
) {
  const config = METRIC_CARD_CONFIG[key];

  if (key === "pagamentosAtrasados") {
    return (
      <MetricCard
        key={key}
        title={config.title}
        value={metrics.pagamentosAtrasados}
        change={`${metrics.quantidadePagamentosAtrasados} atrasado(s)`}
        changeType={config.changeType}
        secondaryInfo={`${metrics.quantidadePagamentosPendentes} pendente(s)`}
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
        title={config.title}
        value={metrics.receitaMensal}
        change={getVariationText(metrics.receitaMensalVariacao)}
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
        title={config.title}
        value={metrics.novosAlunosNoMes}
        change={getVariationText(metrics.novosAlunosVariacao)}
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
        title={config.title}
        value={metrics.trocasProfessorNoMes}
        change={getVariationText(metrics.trocasProfessorVariacao)}
        changeType={getVariationType(metrics.trocasProfessorVariacao)}
        icon={config.icon}
        iconColor={METRIC_CARD_ICON_COLOR}
        href={config.href}
      />
    );
  }

  const value = getMetricValue(key, metrics);

  return (
    <MetricCard
      key={key}
      title={config.title}
      value={value}
      change={config.change}
      changeType={config.changeType}
      icon={config.icon}
      iconColor={METRIC_CARD_ICON_COLOR}
      href={config.href}
    />
  );
}

export function DashboardMetricsGrid({
  metrics,
  optionalCards,
  cardsOrder,
  loading,
}: DashboardMetricsGridProps) {
  const visibleKeys = cardsOrder.filter((key) => {
    if (FIXED_METRIC_CARDS.includes(key as any)) return true;
    return optionalCards[key as OptionalMetricKey];
  });

  const totalVisibleCards = visibleKeys.length;

  const gridClassName =
    totalVisibleCards <= 4
      ? "grid gap-4 md:grid-cols-2"
      : totalVisibleCards === 5
        ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        : "grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

  return (
    <div className={gridClassName}>
      {loading
        ? Array.from({ length: totalVisibleCards }).map((_, index) => (
            <DashboardMetricCardSkeleton key={`metric-skeleton-${index}`} />
          ))
        : visibleKeys.map((key) => renderMetricCard(key, metrics))}
    </div>
  );
}