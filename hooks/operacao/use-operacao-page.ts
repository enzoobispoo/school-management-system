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
  createdAt: string;
  dismissReason: string | null;
}

interface Meta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  canDismissIncidents: boolean;
}

export interface UseOperacaoPageOptions {
  /** Para SUPER_ADMIN: sempre enviar o escopo explicitamente nas chamadas. */
  scopedSchoolId?: string | null;
  fetchEnabled?: boolean;
}

export function useOperacaoPage(options?: UseOperacaoPageOptions) {
  const scopedSchoolId = options?.scopedSchoolId ?? null;
  const fetchEnabled = options?.fetchEnabled ?? true;

  const [incidents, setIncidents] = useState<OperationalIncidentRow[]>([]);
  const [meta, setMeta] = useState<Meta>({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    canDismissIncidents: false,
  });
  const [loading, setLoading] = useState(fetchEnabled);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const appendSchoolScope = useCallback(
    (params: URLSearchParams) => {
      if (scopedSchoolId) params.set("schoolId", scopedSchoolId);
    },
    [scopedSchoolId]
  );

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "20");
      if (statusFilter) params.set("status", statusFilter);
      appendSchoolScope(params);

      const res = await fetch(`/api/operacao/incidentes?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Falha ao carregar");
      const json = await res.json();
      setIncidents(json.data);
      setMeta({
        ...json.meta,
        canDismissIncidents: Boolean(json.meta?.canDismissIncidents),
      });
    } catch {
      setError("Não foi possível carregar a central operacional.");
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, appendSchoolScope]);

  useEffect(() => {
    if (!fetchEnabled) {
      setLoading(false);
      setIncidents([]);
      return;
    }
    fetchIncidents();
  }, [fetchEnabled, fetchIncidents]);

  const evaluateNow = useCallback(async (): Promise<boolean> => {
    try {
      setEvaluating(true);
      setError("");
      const qs = scopedSchoolId
        ? `?schoolId=${encodeURIComponent(scopedSchoolId)}`
        : "";
      const res = await fetch(`/api/operacao/avaliar${qs}`, { method: "POST" });
      if (!res.ok) throw new Error();
      await fetchIncidents();
      return true;
    } catch {
      setError("Não foi possível executar a avaliação agora.");
      return false;
    } finally {
      setEvaluating(false);
    }
  }, [fetchIncidents, scopedSchoolId]);

  const patchIncident = useCallback(
    async (
      id: string,
      action: "acknowledge" | "resolve" | "dismiss",
      dismissReason?: string
    ) => {
      const qs = scopedSchoolId
        ? `?schoolId=${encodeURIComponent(scopedSchoolId)}`
        : "";
      const res = await fetch(`/api/operacao/incidentes/${id}${qs}`, {
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
    [fetchIncidents, scopedSchoolId]
  );

  return {
    incidents,
    meta,
    canDismissIncidents: meta.canDismissIncidents,
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
