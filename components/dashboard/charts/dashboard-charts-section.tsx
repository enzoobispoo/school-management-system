"use client";

import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StudentsByCourseChart } from "@/components/dashboard/students-by-course-chart";

interface DashboardChartsSectionProps {
  data: {
    receitaAoLongoDoTempo: Array<{
      month: string;
      receita: number;
    }>;
    alunosPorCurso: Array<{
      curso: string;
      alunos: number;
    }>;
  } | null;
  loading: boolean;
  /** Painéis sem visão de receita (ex.: secretaria). */
  omitRevenue?: boolean;
}

export function DashboardChartsSection({
  data,
  loading,
  omitRevenue = false,
}: DashboardChartsSectionProps) {
  return (
    <div
      className={
        omitRevenue ?
          "mt-6 grid gap-4"
        : "mt-6 grid gap-4 lg:grid-cols-2"
      }
    >
      {!omitRevenue ?
        <RevenueChart
          data={data?.receitaAoLongoDoTempo ?? []}
          loading={loading}
        />
      : null}

      <StudentsByCourseChart
        data={data?.alunosPorCurso ?? []}
        loading={loading}
      />
    </div>
  );
}