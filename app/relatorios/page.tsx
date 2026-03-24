"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { ReportsPageContent } from "@/components/relatorios/reports-page-content";
import { useReportsPage } from "@/hooks/relatorios/use-reports-page";

export default function RelatoriosPage() {
  const reportsPage = useReportsPage();

  return (
    <DashboardLayout>
      <Header
        title="Relatórios"
        description="Análises e insights do sistema"
      />

      <ReportsPageContent
        year={reportsPage.year}
        setYear={reportsPage.setYear}
        category={reportsPage.category}
        setCategory={reportsPage.setCategory}
        loading={reportsPage.loading}
        error={reportsPage.error}
        data={reportsPage.data}
      />
    </DashboardLayout>
  );
}