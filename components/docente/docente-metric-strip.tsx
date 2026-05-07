"use client";

import { CalendarClock, Layers, Users } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";

export interface DocenteMetricas {
  turmasAtivas: number;
  alunosTotal: number;
  turmasComAulaHoje: number;
}

interface DocenteMetricStripProps {
  metricas: DocenteMetricas;
  /** Rótulo do dia atual (ex.: segunda-feira) para contexto nas métricas. */
  diaLabel: string;
  loading: boolean;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-5 py-4 animate-pulse">
      <div className="mb-3 h-4 w-24 rounded bg-muted" />
      <div className="h-8 w-16 rounded bg-muted" />
    </div>
  );
}

export function DocenteMetricStrip({
  metricas,
  diaLabel,
  loading,
}: DocenteMetricStripProps) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <MetricCard
        title="Turmas ativas"
        value={String(metricas.turmasAtivas)}
        change={diaLabel}
        changeType="neutral"
        icon={Layers}
      />
      <MetricCard
        title="Alunos (titular)"
        value={String(metricas.alunosTotal)}
        change="Matrículas ativas nas suas turmas"
        changeType="neutral"
        icon={Users}
      />
      <MetricCard
        title="Com aula hoje"
        value={String(metricas.turmasComAulaHoje)}
        change="Turmas com horário neste dia"
        changeType="neutral"
        icon={CalendarClock}
      />
    </div>
  );
}
