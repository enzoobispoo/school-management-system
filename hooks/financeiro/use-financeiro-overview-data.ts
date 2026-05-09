"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FinancialAuditTrailItem } from "@/hooks/financeiro/use-financial-query";

interface FinancialTotals {
  receitaTotal: number;
  recebidoMes: number;
  valoresPendentes: number;
  valoresAtrasados: number;
  quantidadePendentes: number;
  quantidadeAtrasados: number;
}

interface FinancialAdvancedMetrics {
  receitaPrevista: number;
  taxaRecebimento: number;
  taxaInadimplencia: number;
}

interface ReportsApiShape {
  revenueEvolution?: Array<{ month: string; atual: number }>;
  popularCourses?: Array<{ name: string; students: number }>;
}

export function useFinanceiroOverviewData() {
  const [loadingMetricas, setLoadingMetricas] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [error, setError] = useState("");
  const [financialTotals, setFinancialTotals] = useState<FinancialTotals>({
    receitaTotal: 0,
    recebidoMes: 0,
    valoresPendentes: 0,
    valoresAtrasados: 0,
    quantidadePendentes: 0,
    quantidadeAtrasados: 0,
  });
  const [auditTrail, setAuditTrail] = useState<FinancialAuditTrailItem[]>([]);
  const [chartData, setChartData] = useState<{
    receitaAoLongoDoTempo: Array<{ month: string; receita: number }>;
    alunosPorCurso: Array<{ curso: string; alunos: number }>;
  } | null>(null);

  const advancedMetrics = useMemo((): FinancialAdvancedMetrics => {
    const receitaPrevista =
      financialTotals.valoresPendentes + financialTotals.valoresAtrasados;
    const baseRecebimento =
      financialTotals.recebidoMes + financialTotals.valoresPendentes;
    const taxaRecebimento =
      baseRecebimento > 0 ?
        (financialTotals.recebidoMes / baseRecebimento) * 100
      : 0;
    const baseInadimplencia =
      financialTotals.receitaTotal + receitaPrevista;
    const taxaInadimplencia =
      baseInadimplencia > 0 ?
        (financialTotals.valoresAtrasados / baseInadimplencia) * 100
      : 0;
    return {
      receitaPrevista,
      taxaRecebimento,
      taxaInadimplencia,
    };
  }, [financialTotals]);

  const fetchMetricas = useCallback(async () => {
    try {
      setLoadingMetricas(true);
      const res = await fetch("/api/financeiro/metricas", { cache: "no-store" });
      if (!res.ok) throw new Error("métricas");
      const data = (await res.json()) as {
        totals: FinancialTotals;
        auditTrail?: FinancialAuditTrailItem[];
      };
      setFinancialTotals(data.totals);
      setAuditTrail(data.auditTrail ?? []);
    } catch {
      setError("Não foi possível carregar os totais financeiros.");
    } finally {
      setLoadingMetricas(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      setLoadingReports(true);
      const year = String(new Date().getFullYear());
      const res = await fetch(`/api/relatorios?year=${year}&category=all`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("relatórios");
      const data = (await res.json()) as ReportsApiShape;
      const rev = data.revenueEvolution ?? [];
      const pop = data.popularCourses ?? [];
      setChartData({
        receitaAoLongoDoTempo: rev.map((r) => ({
          month: r.month,
          receita: r.atual,
        })),
        alunosPorCurso: pop.map((c) => ({
          curso: c.name,
          alunos: c.students,
        })),
      });
    } catch {
      setChartData({ receitaAoLongoDoTempo: [], alunosPorCurso: [] });
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    void fetchMetricas();
    void fetchReports();
  }, [fetchMetricas, fetchReports]);

  const loading = loadingMetricas || loadingReports;

  return {
    loading,
    loadingMetricas,
    loadingReports,
    error,
    financialTotals,
    advancedMetrics,
    auditTrail,
    chartData,
    refresh: fetchMetricas,
  };
}
