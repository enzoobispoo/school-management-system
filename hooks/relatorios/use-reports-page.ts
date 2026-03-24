"use client";

import { useEffect, useState } from "react";

interface ReportsResponse {
  insights: {
    annualGrowth: number;
    retentionRate: number;
    averageTicket: number;
    monthlyGoalRate: number;
    monthlyReceived: number;
    monthlyGoalTarget: number;
  };
  revenueEvolution: Array<{
    month: string;
    atual: number;
    anterior: number;
  }>;
  studentsGrowth: Array<{
    month: string;
    novos: number;
    cancelados: number;
  }>;
  popularCourses: Array<{
    name: string;
    students: number;
    percentage: number;
  }>;
}

export function useReportsPage() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [category, setCategory] = useState("all");
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchReports() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("year", year);
      params.set("category", category);

      const response = await fetch(`/api/relatorios?${params.toString()}`, {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao carregar relatórios");
      }

      setData(result);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os relatórios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, [year, category]);

  return {
    year,
    setYear,
    category,
    setCategory,
    data,
    loading,
    error,
    fetchReports,
  };
}