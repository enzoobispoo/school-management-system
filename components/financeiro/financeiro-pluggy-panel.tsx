"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Building2, RefreshCw, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  dashboardLocaleTag,
  useDashboardLanguage,
  type DashboardLanguage,
} from "@/lib/i18n/dashboard-language";

const PluggyConnect = dynamic(
  () => import("react-pluggy-connect").then((m) => m.PluggyConnect),
  { ssr: false }
);

type OverviewPayload = {
  pluggyAllowed: boolean;
  planTier?: string;
  canManageWrites?: boolean;
  connection: {
    pluggyItemId: string;
    institutionName: string | null;
    status: string;
    pluggyItemStatus: string | null;
    lastSyncedAt: string | null;
    lastSyncError: string | null;
  } | null;
  consolidatedBankBalance: string | number | { toString(): string } | null;
  recentTransactions: Array<{
    id: string;
    date: string;
    amount: string | number | { toString(): string };
    type: string;
    description: string;
    reconciledPagamentoId: string | null;
    account: { name: string };
  }>;
  unreconciledCredits: number;
  reconciledTransactions: number;
  lastSyncLogStatus: string | null;
};

function pluggyWidgetLanguage(lang: DashboardLanguage): string {
  if (lang === "pt-BR") return "pt";
  return lang;
}

function formatMoney(value: unknown, language: DashboardLanguage): string {
  const n =
    typeof value === "number" ? value
    : typeof value === "string" ? Number(value)
    : value && typeof value === "object" && "toString" in value ?
      Number((value as { toString(): string }).toString())
    : NaN;
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(dashboardLocaleTag(language), {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

export function FinanceiroPluggyPanel() {
  const { t, language } = useDashboardLanguage();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/financeiro/pluggy/overview", { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error ?? "PLUGGY_OVERVIEW_FAILED");
    }
    setOverview(data as OverviewPayload);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        await load();
      } catch {
        toast.error(t("finance.pluggy.syncFail"));
      } finally {
        setLoading(false);
      }
    })();
  }, [load, t]);

  const canManage = overview?.canManageWrites === true;

  const openWidget = async () => {
    if (!canManage) return;
    try {
      setTokenLoading(true);
      const res = await fetch("/api/financeiro/pluggy/connect-token", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "token");
      }
      setConnectToken(String(data.connectToken));
      setWidgetOpen(true);
    } catch {
      toast.error(t("finance.pluggy.connectionFail"));
    } finally {
      setTokenLoading(false);
    }
  };

  const handleSuccess = async (item: { id: string }) => {
    try {
      setBusy(true);
      const res = await fetch("/api/financeiro/pluggy/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "save");
      toast.success(t("finance.pluggy.connectionSaved"));
      setWidgetOpen(false);
      setConnectToken(null);
      await load();
    } catch {
      toast.error(t("finance.pluggy.connectionFail"));
    } finally {
      setBusy(false);
    }
  };

  const sync = async () => {
    if (!canManage) return;
    try {
      setBusy(true);
      const res = await fetch("/api/financeiro/pluggy/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "sync");
      toast.success(t("finance.pluggy.syncOk"));
      await load();
    } catch {
      toast.error(t("finance.pluggy.syncFail"));
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!canManage) return;
    try {
      setBusy(true);
      const res = await fetch("/api/financeiro/pluggy/connection", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete");
      toast.success(t("finance.openFinance.disconnectOk"));
      await load();
    } catch {
      toast.error(t("finance.pluggy.syncFail"));
    } finally {
      setBusy(false);
    }
  };

  const includeSandbox = useMemo(() => process.env.NODE_ENV !== "production", []);

  if (loading || !overview) {
    return (
      <section className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">{t("finance.pluggy.loading")}</p>
      </section>
    );
  }

  if (!overview.pluggyAllowed) {
    return (
      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Building2 className="mt-0.5 h-5 w-5 text-amber-700 dark:text-amber-300" />
          <div>
            <h2 className="text-base font-semibold tracking-tight">{t("finance.pluggy.upgradeTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("finance.pluggy.upgradeBody")}</p>
          </div>
        </div>
      </section>
    );
  }

  const balanceLabel = formatMoney(overview.consolidatedBankBalance, language);

  return (
    <section className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{t("finance.pluggy.title")}</h2>
          <p className="mt-1 max-w-3xl text-xs text-muted-foreground">{t("finance.pluggy.subtitle")}</p>
        </div>
        {canManage ?
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="rounded-xl gap-1.5"
              disabled={busy || tokenLoading}
              onClick={() => void openWidget()}
            >
              <Building2 className="h-3.5 w-3.5" />
              {t("finance.pluggy.connectBank")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-xl gap-1.5"
              disabled={busy || !overview.connection}
              onClick={() => void sync()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t("finance.pluggy.syncNow")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-xl gap-1.5"
              disabled={busy || !overview.connection}
              onClick={() => void disconnect()}
            >
              <Unplug className="h-3.5 w-3.5" />
              {t("finance.pluggy.disconnect")}
            </Button>
          </div>
        : (
          <p className="text-xs text-muted-foreground">{t("finance.pluggy.readOnlyHint")}</p>
        )}
      </div>

      {overview.connection?.lastSyncError ?
        <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {t("finance.pluggy.statusError")}: {overview.connection.lastSyncError}
        </div>
      : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/50 bg-muted/10 px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("finance.pluggy.consolidatedBalance")}
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{balanceLabel}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-muted/10 px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("finance.pluggy.unreconciledCredits")}
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{overview.unreconciledCredits}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-muted/10 px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("finance.pluggy.reconciledCount")}
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{overview.reconciledTransactions}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-muted/10 px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("finance.pluggy.lastSync")}
          </p>
          <p className="mt-1 text-sm font-medium">
            {overview.connection?.lastSyncedAt ?
              new Date(overview.connection.lastSyncedAt).toLocaleString(dashboardLocaleTag(language))
            : t("finance.pluggy.neverSynced")}
          </p>
          {overview.lastSyncLogStatus ?
            <p className="mt-1 text-[11px] text-muted-foreground">{overview.lastSyncLogStatus}</p>
          : null}
        </div>
      </div>

      {overview.connection?.institutionName ?
        <p className="mt-3 text-xs text-muted-foreground">
          {t("finance.pluggy.institution")}:{" "}
          <span className="font-medium text-foreground">{overview.connection.institutionName}</span>
        </p>
      : null}

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("finance.pluggy.lastMovements")}
        </p>
        {overview.recentTransactions.length === 0 ?
          <p className="mt-2 text-sm text-muted-foreground">{t("finance.pluggy.noTransactions")}</p>
        : (
          <ul className="mt-2 space-y-2">
            {overview.recentTransactions.map((tx) => (
              <li
                key={tx.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-border/40 bg-muted/5 px-3 py-2 text-xs"
              >
                <span className="text-muted-foreground">
                  {new Date(tx.date).toLocaleDateString(dashboardLocaleTag(language))} · {tx.account.name}
                </span>
                <span className="tabular-nums font-medium">
                  {tx.type} · {formatMoney(tx.amount, language)}
                </span>
                <span className="w-full text-[11px] text-muted-foreground line-clamp-2">{tx.description}</span>
                {tx.reconciledPagamentoId ?
                  <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
                    {t("finance.pluggy.reconciledBadge")}
                  </span>
                : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog
        open={widgetOpen}
        onOpenChange={(o) => {
          if (busy) return;
          setWidgetOpen(o);
          if (!o) setConnectToken(null);
        }}
      >
        <DialogContent className="max-w-[960px] rounded-[28px]">
          <DialogHeader>
            <DialogTitle>{t("finance.pluggy.connectBank")}</DialogTitle>
            <DialogDescription>{t("finance.pluggy.widgetHint")}</DialogDescription>
          </DialogHeader>
          {connectToken ?
            <div className="min-h-[420px] w-full">
              <PluggyConnect
                connectToken={connectToken}
                countries={["BR"]}
                products={["ACCOUNTS", "TRANSACTIONS"]}
                language={pluggyWidgetLanguage(language)}
                theme="light"
                includeSandbox={includeSandbox}
                onSuccess={async ({ item }) => {
                  await handleSuccess(item);
                }}
                onError={() => {
                  toast.error(t("finance.pluggy.connectionFail"));
                }}
              />
            </div>
          : (
            <p className="text-sm text-muted-foreground">{t("finance.pluggy.loading")}</p>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
