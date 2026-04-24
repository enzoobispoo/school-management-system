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
}

export function DashboardChartsSection({
  data,
  loading,
}: DashboardChartsSectionProps) {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <RevenueChart
        data={data?.receitaAoLongoDoTempo ?? []}
        loading={loading}
      />

      <StudentsByCourseChart
        data={data?.alunosPorCurso ?? []}
        loading={loading}
      />
    </div>
  );
}