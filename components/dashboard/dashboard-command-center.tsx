"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  ClipboardCheck,
  Clock3,
  Layers,
  UserPlus,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DashboardMetricsView } from "@/components/dashboard/metrics/dashboard-metric-card-config";

function parseCount(value: string): number | null {
  if (!value || value === "...") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

interface OpTileProps {
  href: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string | null;
  emphasize?: boolean;
  loading: boolean;
}

function OpTile({
  href,
  title,
  description,
  icon: Icon,
  badge,
  emphasize,
  loading,
}: OpTileProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex gap-3 rounded-2xl border border-border/70 bg-card/80 p-3 transition-colors hover:bg-muted/25",
        emphasize && "border-amber-500/35 bg-amber-500/[0.06] dark:bg-amber-500/10"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-foreground/80",
          emphasize && "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold leading-tight text-foreground">{title}</p>
          {!loading && badge ? (
            <Badge
              variant={emphasize ? "destructive" : "secondary"}
              className="h-5 rounded-full px-2 text-[10px] font-semibold uppercase tracking-wide"
            >
              {badge}
            </Badge>
          ) : null}
          {loading ? (
            <span className="h-4 w-10 animate-pulse rounded-full bg-muted" />
          ) : null}
        </div>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{description}</p>
        <p className="mt-1 text-[11px] font-medium text-muted-foreground/80 group-hover:text-foreground">
          Abrir →
        </p>
      </div>
    </Link>
  );
}

interface DashboardCommandCenterProps {
  metrics: DashboardMetricsView;
  loading: boolean;
}

export function DashboardCommandCenter({ metrics, loading }: DashboardCommandCenterProps) {
  const atrasados = metrics.quantidadePagamentosAtrasados ?? 0;
  const pendentes = metrics.quantidadePagamentosPendentes ?? 0;
  const novos = parseCount(metrics.novosAlunosNoMes);
  const lotadas = parseCount(metrics.turmasLotadas);
  const ociosas = parseCount(metrics.turmasComVagasOciosas);

  return (
    <section className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            Operações
          </p>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Central de operações
          </h3>
          <p className="text-xs text-muted-foreground">
            Atalhos pensados para secretarias com alto volume de alunos e cobranças.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <OpTile
          href="/financeiro?tab=overdue"
          title="Inadimplência"
          description="Priorize cobrança e regularização."
          icon={Wallet}
          badge={atrasados > 0 ? `${atrasados} atrasado(s)` : "Em dia"}
          emphasize={atrasados > 0}
          loading={loading}
        />
        <OpTile
          href="/financeiro?tab=pending"
          title="Pagamentos pendentes"
          description="Mensalidades em aberto neste período."
          icon={Clock3}
          badge={pendentes > 0 ? `${pendentes} pendente(s)` : "Nenhum"}
          loading={loading}
        />
        <OpTile
          href="/alunos?recent=true"
          title="Novos alunos (mês)"
          description="Últimas matrículas recentes."
          icon={UserPlus}
          badge={novos !== null ? `${novos} novo(s)` : undefined}
          loading={loading}
        />
        <OpTile
          href="/turmas"
          title="Capacidade das turmas"
          description="Lotadas vs vagas disponíveis."
          icon={Layers}
          badge={
            lotadas !== null && ociosas !== null
              ? `${lotadas} lotada(s) · ${ociosas} com vaga(s)`
              : undefined
          }
          loading={loading}
        />
        <OpTile
          href="/academico"
          title="Acadêmico"
          description="Boletins, frequência e turmas."
          icon={ClipboardCheck}
          loading={loading}
        />
        <OpTile
          href="/relatorios"
          title="Relatórios"
          description="Consolidados para gestão e reuniões."
          icon={BarChart3}
          loading={loading}
        />
        <OpTile
          href="/alunos?status=overdue"
          title="Alunos com cobrança atrasada"
          description="Lista filtrada por situação financeira."
          icon={AlertTriangle}
          badge={atrasados > 0 ? `${atrasados} com atraso` : undefined}
          emphasize={atrasados > 0}
          loading={loading}
        />
      </div>
    </section>
  );
}
