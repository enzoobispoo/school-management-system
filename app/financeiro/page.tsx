"use client";

import { Header } from "@/components/dashboard/header";
import { DashboardMainLayout } from "@/components/dashboard/dashboard-main-layout";
import { FinanceiroEduiaSidePanel } from "@/components/financeiro/financeiro-eduia-side-panel";
import { FinanceiroHubNav } from "@/components/financeiro/financeiro-hub-nav";
import { FinanceiroOverviewContent } from "@/components/financeiro/financeiro-overview-content";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

export default function FinanceiroOverviewPage() {
  const { t } = useDashboardLanguage();

  return (
    <>
      <Header
        title={t("finance.header.title")}
        description={t("finance.header.description")}
      />
      <FinanceiroHubNav />
      <DashboardMainLayout
        rightPanel={<FinanceiroEduiaSidePanel layout="sidebar" chrome="full" />}
      >
        <FinanceiroOverviewContent />
      </DashboardMainLayout>
    </>
  );
}
