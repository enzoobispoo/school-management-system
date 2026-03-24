"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { DashboardPageContent } from "@/components/dashboard/dashboard-page-content";
import { DashboardMainLayout } from "@/components/dashboard/dashboard-main-layout";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { DashboardRightPanel } from "@/components/dashboard/dashboard-right-panel";
import { useDashboardPage } from "@/hooks/dashboard/use-dashboard-page";

export default function DashboardPage() {
  const dashboard = useDashboardPage();

  return (
    <DashboardLayout>
      <Header
        title="Dashboard"
        description="Visão geral do seu sistema escolar"
      />

      <DashboardMainLayout rightPanel={<DashboardRightPanel />}>
        <DashboardGreeting name="Administrador" />

        <DashboardPageContent
          data={dashboard.data}
          loading={dashboard.loading}
          error={dashboard.error}
          metrics={dashboard.metrics}
          recentActivities={dashboard.recentActivities}
        />
      </DashboardMainLayout>
    </DashboardLayout>
  );
}