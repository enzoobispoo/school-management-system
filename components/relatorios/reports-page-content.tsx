"use client";

import { InsightsCards } from "@/components/relatorios/insights-cards";
import { RevenueEvolutionChart } from "@/components/relatorios/revenue-evolution-chart";
import { StudentsGrowthChart } from "@/components/relatorios/students-growth-chart";
import { PopularCoursesChart } from "@/components/relatorios/popular-courses-chart";
import { ReportsToolbar } from "@/components/relatorios/reports-toolbar";

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
  return (
    <div className="p-6">
      <ReportsToolbar
        year={year}
        setYear={setYear}
        category={category}
        setCategory={setCategory}
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
    </div>
  );
}