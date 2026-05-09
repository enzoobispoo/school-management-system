"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ClipboardCheck,
  Clock3,
  Layers,
  MessageSquare,
  UserPlus,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DashboardMetricsView } from "@/components/dashboard/metrics/dashboard-metric-card-config";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

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
  openLabel: string;
}

function OpTile({
  href,
  title,
  description,
  icon: Icon,
  badge,
  emphasize,
  loading,
  openLabel,
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
          {openLabel}
        </p>
      </div>
    </Link>
  );
}

interface DashboardCommandCenterProps {
  metrics: DashboardMetricsView;
  loading: boolean;
  /** Sem atalhos diretos para cobrança / financeiro. */
  variant?: "default" | "secretaria";
}

export function DashboardCommandCenter({
  metrics,
  loading,
  variant = "default",
}: DashboardCommandCenterProps) {
  const { t } = useDashboardLanguage();
  const atrasados = metrics.quantidadePagamentosAtrasados ?? 0;
  const pendentes = metrics.quantidadePagamentosPendentes ?? 0;
  const novos = parseCount(metrics.novosAlunosNoMes);
  const lotadas = parseCount(metrics.turmasLotadas);
  const ociosas = parseCount(metrics.turmasComVagasOciosas);
  const incAbertos = metrics.incidentesOperacionaisAbertos ?? 0;
  const incCrit = metrics.incidentesOperacionaisCriticos ?? 0;
  const isSecretaria = variant === "secretaria";

  const incidentBadge =
    incAbertos > 0 ?
      incCrit > 0 ?
        t("cmd.badge.incidents", { open: incAbertos, crit: incCrit })
      : t("cmd.badge.incidentsOpen", { open: incAbertos })
    : t("cmd.badge.noAlerts");

  const openLabel = t("cmd.openArrow");

  return (
    <section className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            {t("cmd.sectionEyebrow")}
          </p>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {t("cmd.title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isSecretaria ? t("cmd.intro.secretaria") : t("cmd.intro.default")}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <OpTile
          href="/operacao"
          title={t("cmd.tile.operational.title")}
          description={
            isSecretaria ?
              t("cmd.tile.operational.desc.secretaria")
            : t("cmd.tile.operational.desc.default")
          }
          icon={Activity}
          badge={incidentBadge}
          emphasize={incCrit > 0}
          loading={loading}
          openLabel={openLabel}
        />
        {!isSecretaria ?
          <OpTile
            href="/financeiro/cobrancas?tab=overdue"
            title={t("cmd.tile.overdue.title")}
            description={t("cmd.tile.overdue.desc")}
            icon={Wallet}
            badge={
              atrasados > 0 ?
                t("cmd.badge.overdueCount", { n: atrasados })
              : t("cmd.badge.onTrack")
            }
            emphasize={atrasados > 0}
            loading={loading}
            openLabel={openLabel}
          />
        : null}
        {!isSecretaria ?
          <OpTile
            href="/financeiro/cobrancas?tab=pending"
            title={t("cmd.tile.pending.title")}
            description={t("cmd.tile.pending.desc")}
            icon={Clock3}
            badge={
              pendentes > 0 ?
                t("cmd.badge.pendingCount", { n: pendentes })
              : t("cmd.badge.nonePending")
            }
            loading={loading}
            openLabel={openLabel}
          />
        : null}
        <OpTile
          href="/alunos?recent=true"
          title={t("cmd.tile.newStudents.title")}
          description={t("cmd.tile.newStudents.desc")}
          icon={UserPlus}
          badge={novos !== null ? t("cmd.badge.newCount", { n: novos }) : undefined}
          loading={loading}
          openLabel={openLabel}
        />
        <OpTile
          href="/turmas"
          title={t("cmd.tile.capacity.title")}
          description={t("cmd.tile.capacity.desc")}
          icon={Layers}
          badge={
            lotadas !== null && ociosas !== null ?
              t("cmd.badge.capacity", { lot: lotadas, vac: ociosas })
            : undefined
          }
          loading={loading}
          openLabel={openLabel}
        />
        <OpTile
          href="/academico"
          title={t("cmd.tile.academic.title")}
          description={t("cmd.tile.academic.desc")}
          icon={ClipboardCheck}
          loading={loading}
          openLabel={openLabel}
        />
        <OpTile
          href="/relatorios"
          title={t("cmd.tile.reports.title")}
          description={t("cmd.tile.reports.desc")}
          icon={BarChart3}
          loading={loading}
          openLabel={openLabel}
        />
        {isSecretaria ?
          <OpTile
            href="/mensagens"
            title={t("cmd.tile.messages.title")}
            description={t("cmd.tile.messages.desc")}
            icon={MessageSquare}
            loading={loading}
            openLabel={openLabel}
          />
        : null}
        {!isSecretaria ?
          <OpTile
            href="/alunos?status=overdue"
            title={t("cmd.tile.studentsOverdue.title")}
            description={t("cmd.tile.studentsOverdue.desc")}
            icon={AlertTriangle}
            badge={
              atrasados > 0 ?
                t("cmd.badge.studentsOverdue", { n: atrasados })
              : undefined
            }
            emphasize={atrasados > 0}
            loading={loading}
            openLabel={openLabel}
          />
        : null}
      </div>
    </section>
  );
}
