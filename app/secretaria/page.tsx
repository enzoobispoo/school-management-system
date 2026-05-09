"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { DashboardMainLayout } from "@/components/dashboard/dashboard-main-layout";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { DashboardRightPanel } from "@/components/dashboard/dashboard-right-panel";
import { DashboardPageContent } from "@/components/dashboard/dashboard-page-content";
import { useDashboardPage } from "@/hooks/dashboard/use-dashboard-page";
import { defaultHomePathForRole } from "@/lib/navigation/default-home";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

function SecretariaSuspenseFallback() {
  const { t } = useDashboardLanguage();
  return (
    <>
      <Header titleKey="page.secretaria.title" descriptionKey="common.loading" />
      <DashboardMainLayout rightPanel={null}>
        <div className="rounded-[28px] border border-border/40 bg-muted/20 px-7 py-12 text-center text-sm text-muted-foreground">
          {t("common.loadingPanel")}
        </div>
      </DashboardMainLayout>
    </>
  );
}

function SecretariaDashboardBody() {
  const dashboard = useDashboardPage();
  const searchParams = useSearchParams();
  const initialAiPrompt = searchParams.get("ai") || "";

  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);

  const audience =
    userRole === "SECRETARIA_FINANCEIRA" ? "secretaria_financeira" : "secretaria";
  const greetingVariant =
    userRole === "SECRETARIA_FINANCEIRA" ?
      "secretaria_financeira"
    : "secretaria";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        if (res.ok) {
          const role = data.user?.role as string | undefined;
          const home = defaultHomePathForRole(role);
          if (home !== "/secretaria") {
            window.location.href = home;
            return;
          }
          setUserName(data.user?.nome || "");
          setUserRole(
            typeof data.user?.role === "string" ? data.user.role : null
          );
        }
      } catch {
        /* ignore */
      } finally {
        setSessionResolved(true);
      }
    }
    loadUser();
  }, []);

  return (
    <DashboardLayout>
      <Header
        titleKey="page.secretaria.title"
        descriptionKey="page.secretaria.description"
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
        <DashboardGreeting
          variant={greetingVariant}
          name={userName}
        />

        <DashboardPageContent
          audience={audience}
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

export default function SecretariaPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <SecretariaSuspenseFallback />
        </DashboardLayout>
      }
    >
      <SecretariaDashboardBody />
    </Suspense>
  );
}
