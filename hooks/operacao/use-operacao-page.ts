"use client";

import { useCallback, useEffect, useState } from "react";

export interface OperationalIncidentRow {
  id: string;
  playbookCode: string | null;
  dedupeKey: string;
  category: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  problemStatement: string;
  suggestedActions: string[];
  impactHint: string | null;
  contextJson: unknown;
  lastDetectedAt: string;
  dismissReason: string | null;
}

interface Meta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useOperacaoPage() {
  const [incidents, setIncidents] = useState<OperationalIncidentRow[]>([]);
  const [meta, setMeta] = useState<Meta>({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "20");
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/operacao/incidentes?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Falha ao carregar");
      const json = await res.json();
      setIncidents(json.data);
      setMeta(json.meta);
    } catch {
      setError("Não foi possível carregar a central operacional.");
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const evaluateNow = useCallback(async (): Promise<boolean> => {
    try {
      setEvaluating(true);
      setError("");
      const res = await fetch("/api/operacao/avaliar", { method: "POST" });
      if (!res.ok) throw new Error();
      await fetchIncidents();
      return true;
    } catch {
      setError("Não foi possível executar a avaliação agora.");
      return false;
    } finally {
      setEvaluating(false);
    }
  }, [fetchIncidents]);

  const patchIncident = useCallback(
    async (
      id: string,
      action: "acknowledge" | "resolve" | "dismiss",
      dismissReason?: string
    ) => {
      const res = await fetch(`/api/operacao/incidentes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, dismissReason }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Falha ao atualizar");
      }
      await fetchIncidents();
    },
    [fetchIncidents]
  );

  return {
    incidents,
    meta,
    loading,
    evaluating,
    error,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    evaluateNow,
    patchIncident,
    refetch: fetchIncidents,
  };
}
