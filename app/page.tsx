"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { DashboardPageContent } from "@/components/dashboard/dashboard-page-content";
import { DashboardMainLayout } from "@/components/dashboard/dashboard-main-layout";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { DashboardRightPanel } from "@/components/dashboard/dashboard-right-panel";
import { useDashboardPage } from "@/hooks/dashboard/use-dashboard-page";

export default function DashboardPage() {
  const dashboard = useDashboardPage();

  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (res.ok) {
          setUserName(data.user?.nome || "");
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }
    }

    loadUser();
  }, []);

  return (
    <DashboardLayout>
      <Header
        title="Dashboard"
        description="Visão geral do seu sistema escolar"
      />

      <DashboardMainLayout rightPanel={<DashboardRightPanel />}>
        <DashboardGreeting
          name={userName ? userName.split(" ")[0] : "Usuário"}
        />

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