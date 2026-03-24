"use client";

import { Users, GraduationCap, Wallet, AlertCircle } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StudentsByCourseChart } from "@/components/dashboard/students-by-course-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { ErrorState } from "@/components/shared/error-state";

interface DashboardPageContentProps {
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
  error: string;
  metrics: {
    totalAlunos: string;
    matriculasAtivas: string;
    receitaMensal: string;
    pagamentosAtrasados: string;
    quantidadePagamentosAtrasados: number;
    quantidadePagamentosPendentes: number;
  };
  recentActivities: Array<{
    id: string;
    type: "enrollment" | "payment" | "new_student";
    name: string;
    description: string;
    time: string;
    initials: string;
  }>;
}

export function DashboardPageContent({
  data,
  loading,
  error,
  metrics,
  recentActivities,
}: DashboardPageContentProps) {
  return (
    <div className="mt-10">
      {error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <MetricCard
              title="Total de Alunos"
              value={metrics.totalAlunos}
              change="Alunos cadastrados"
              changeType="neutral"
              icon={Users}
              iconColor="bg-black/[0.04] text-black"
            />

            <MetricCard
              title="Matrículas Ativas"
              value={metrics.matriculasAtivas}
              change="Matrículas em andamento"
              changeType="neutral"
              icon={GraduationCap}
              iconColor="bg-black/[0.04] text-black"
            />

            <MetricCard
              title="Receita Mensal"
              value={metrics.receitaMensal}
              change="Recebido no mês"
              changeType="positive"
              icon={Wallet}
              iconColor="bg-black/[0.04] text-black"
            />

            <MetricCard
              title="Pagamentos Atrasados"
              value={metrics.pagamentosAtrasados}
              change={`${metrics.quantidadePagamentosAtrasados} atrasado(s)`}
              changeType="negative"
              secondaryInfo={`${metrics.quantidadePagamentosPendentes} pendente(s)`}
              icon={AlertCircle}
              iconColor="bg-black/[0.04] text-black"
            />
          </div>

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

          <div className="mt-6">
            <RecentActivity activities={recentActivities} loading={loading} />
          </div>
        </>
      )}
    </div>
  );
}