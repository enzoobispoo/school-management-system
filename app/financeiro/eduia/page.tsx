"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { FinanceiroHubNav } from "@/components/financeiro/financeiro-hub-nav";
import { FinanceiroEduiaHubBody } from "@/components/financeiro/financeiro-eduia-hub-body";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

function FinanceiroEduiaInner() {
  const { t } = useDashboardLanguage();
  const searchParams = useSearchParams();
  const initialAi = searchParams.get("ai")?.trim() ?? "";

  return (
    <section className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden lg:h-dvh">
      <div className="shrink-0">
        <Header
          title={t("finance.eduia.title")}
          description={t("finance.eduia.description")}
        />
        <FinanceiroHubNav />
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-6 pb-8 pt-2">
        <FinanceiroEduiaHubBody initialPrompt={initialAi} />
      </div>
    </section>
  );
}

export default function FinanceiroEduiaPage() {
  return (
    <Suspense fallback={null}>
      <FinanceiroEduiaInner />
    </Suspense>
  );
}
