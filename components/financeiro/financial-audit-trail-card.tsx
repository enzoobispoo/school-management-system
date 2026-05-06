"use client";

import { useMemo, useState } from "react";
import type { FinancialAuditTrailItem } from "@/hooks/financeiro/use-financial-query";

interface FinancialAuditTrailCardProps {
  items: FinancialAuditTrailItem[];
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

export function FinancialAuditTrailCard({ items }: FinancialAuditTrailCardProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed" | "ignored">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "cron" | "webhook" | "manual" | "api">("all");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (sourceFilter !== "all" && item.source !== sourceFilter) return false;
      return true;
    });
  }, [items, sourceFilter, statusFilter]);

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">
          Auditoria financeira (eventos)
        </h3>
        <div className="flex flex-wrap gap-2">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="all">Todas as origens</option>
            <option value="cron">Cron</option>
            <option value="webhook">Webhook</option>
            <option value="api">API</option>
            <option value="manual">Manual</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="all">Todos status</option>
            <option value="success">Sucesso</option>
            <option value="failed">Falha</option>
            <option value="ignored">Ignorado</option>
          </select>
        </div>
      </div>

      <div className="max-h-64 space-y-2 overflow-auto pr-1">
        {filteredItems.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Sem eventos para os filtros selecionados.
          </p>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border/70 bg-muted/20 p-2"
            >
              <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground/80">
                  {item.source}
                </span>
                <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground/80">
                  {item.status}
                </span>
                <span className="text-muted-foreground">
                  {formatDateTime(item.createdAt)}
                </span>
              </div>
              <p className="text-xs font-medium text-foreground">
                {normalizeLabel(item.eventType)}
              </p>
              <p className="text-xs text-muted-foreground">{item.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

