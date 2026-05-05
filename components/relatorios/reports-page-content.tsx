"use client";

import { InsightsCards } from "@/components/relatorios/insights-cards";
import { RevenueEvolutionChart } from "@/components/relatorios/revenue-evolution-chart";
import { StudentsGrowthChart } from "@/components/relatorios/students-growth-chart";
import { PopularCoursesChart } from "@/components/relatorios/popular-courses-chart";
import { ReportsToolbar } from "@/components/relatorios/reports-toolbar";
import { InadimplenciaReport } from "@/components/relatorios/inadimplencia-report";
import { exportToCSV } from "@/lib/export/export-to-csv";
import { useState } from "react";

interface ReportsPageContentProps {
  year: string;
  setYear: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  loading: boolean;
  error: string;
  data: {
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
  } | null;
}

export function ReportsPageContent({
  year,
  setYear,
  category,
  setCategory,
  loading,
  error,
  data,
}: ReportsPageContentProps) {
  const [tab, setTab] = useState<"geral" | "inadimplencia">("geral");

  function handleExport() {
    if (!data) return;
    exportToCSV(
      data.revenueEvolution.map((r) => ({
        Mês: r.month,
        "Receita Atual": r.atual,
        "Receita Anterior": r.anterior,
      })),
      `relatorio-receita-${year}.csv`
    );
  }

  return (
    <div className="p-6">
      {/* Abas */}
      <div className="mb-6 flex gap-1 rounded-2xl border border-border/50 bg-muted/30 p-1 w-fit">
        {(["geral", "inadimplencia"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "geral" ? "Visão Geral" : "Inadimplência"}
          </button>
        ))}
      </div>

      {tab === "inadimplencia" ? (
        <InadimplenciaReport />
      ) : (
        <>
          <ReportsToolbar
            year={year}
            setYear={setYear}
            category={category}
            setCategory={setCategory}
            onExport={handleExport}
          />

          {error ? (
            <div className="rounded-[24px] border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : loading ? (
            <div className="rounded-[24px] border border-border/50 bg-card p-8 text-sm text-muted-foreground">
              Carregando relatórios...
            </div>
          ) : (
            <>
              <InsightsCards insights={data?.insights} />

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <RevenueEvolutionChart data={data?.revenueEvolution ?? []} />
                <StudentsGrowthChart data={data?.studentsGrowth ?? []} />
              </div>

              <div className="mt-6">
                <PopularCoursesChart courses={data?.popularCourses ?? []} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}