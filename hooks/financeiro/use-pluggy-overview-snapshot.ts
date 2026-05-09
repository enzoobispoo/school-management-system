"use client";

import { useCallback, useEffect, useState } from "react";

export type PluggyOverviewSnapshot = {
  loading: boolean;
  fetchFailed: boolean;
  pluggyAllowed: boolean;
  connected: boolean;
  institutionName: string | null;
  consolidatedBankBalance: number | null;
  lastSyncAt: Date | null;
  lastSyncError: string | null;
  unreconciledCredits: number;
  refresh: () => Promise<void>;
};

function parseBalance(raw: unknown): number | null {
  if (raw == null) return null;
  const n = typeof raw === "number" ? raw : Number(String(raw));
  return Number.isFinite(n) ? n : null;
}

export function usePluggyOverviewSnapshot(): PluggyOverviewSnapshot {
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [pluggyAllowed, setPluggyAllowed] = useState(false);
  const [connected, setConnected] = useState(false);
  const [institutionName, setInstitutionName] = useState<string | null>(null);
  const [consolidatedBankBalance, setConsolidatedBankBalance] = useState<number | null>(
    null
  );
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [unreconciledCredits, setUnreconciledCredits] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchFailed(false);
    try {
      const res = await fetch("/api/financeiro/pluggy/overview", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
      if (!res.ok || !data) {
        setFetchFailed(true);
        setPluggyAllowed(false);
        setConnected(false);
        setInstitutionName(null);
        setConsolidatedBankBalance(null);
        setLastSyncAt(null);
        setLastSyncError(null);
        setUnreconciledCredits(0);
        return;
      }

      const allowed = data.pluggyAllowed === true;
      setPluggyAllowed(allowed);

      const conn = data.connection as
        | { pluggyItemId?: string; institutionName?: string | null }
        | null
        | undefined;
      const hasConn = Boolean(conn?.pluggyItemId);
      setConnected(hasConn);
      setInstitutionName(conn?.institutionName ?? null);
      setConsolidatedBankBalance(parseBalance(data.consolidatedBankBalance));

      const syncRaw = data.lastSyncAt as string | null | undefined;
      setLastSyncAt(syncRaw ? new Date(syncRaw) : null);
      setLastSyncError(
        typeof data.lastSyncError === "string" ? data.lastSyncError : null
      );

      const ur = data.unreconciledCredits;
      setUnreconciledCredits(typeof ur === "number" ? ur : 0);
    } catch {
      setFetchFailed(true);
      setPluggyAllowed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    loading,
    fetchFailed,
    pluggyAllowed,
    connected,
    institutionName,
    consolidatedBankBalance,
    lastSyncAt,
    lastSyncError,
    unreconciledCredits,
    refresh: load,
  };
}
