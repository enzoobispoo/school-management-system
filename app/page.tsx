"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { DashboardPageContent } from "@/components/dashboard/dashboard-page-content";
import { DashboardMainLayout } from "@/components/dashboard/dashboard-main-layout";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { DashboardRightPanel } from "@/components/dashboard/dashboard-right-panel";
import { useDashboardPage } from "@/hooks/dashboard/use-dashboard-page";
import { defaultHomePathForRole } from "@/lib/navigation/default-home";

export default function DashboardPage() {
  const dashboard = useDashboardPage();
  const searchParams = useSearchParams();
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);

  const initialAiPrompt = searchParams.get("ai") || "";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (res.ok) {
          const role = data.user?.role as string | undefined;
          const home = defaultHomePathForRole(role);
          if (home !== "/") {
            window.location.href = home;
            return;
          }
          setUserName(data.user?.nome || "");
          setUserRole(
            typeof data.user?.role === "string" ? data.user.role : null
          );
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      } finally {
        setSessionResolved(true);
      }
    }

    loadUser();
  }, []);

  return (
    <DashboardLayout>
      <Header
        titleKey="page.dashboard.title"
        descriptionKey="page.dashboard.description"
      />

      <DashboardMainLayout
        rightPanel={
          !sessionResolved || userRole === "PROFESSOR" ? null : (
            <DashboardRightPanel
              initialPrompt={initialAiPrompt}
              dashboardMetrics={dashboard.metrics}
              dashboardMetricsLoading={dashboard.loading}
              dashboardMetricsError={dashboard.error !== ""}
            />
          )
        }
      >
        <DashboardGreeting name={userName} />

        <DashboardPageContent
          data={dashboard.data}
          loading={dashboard.loading}
          error={dashboard.error}
          metrics={dashboard.metrics}
          recentActivities={dashboard.recentActivities}
          insights={dashboard.insights}
        />
      </DashboardMainLayout>
    </DashboardLayout>
  );
}
