"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { EduiaHubBody } from "@/components/dashboard/eduia-hub-body";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

function EduiaLoadingShell() {
  const { t } = useDashboardLanguage();
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      {t("page.eduia.loading")}
    </div>
  );
}

function EduiaSchoolInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAi = searchParams.get("ai")?.trim() ?? "";
  const [gate, setGate] = useState<"loading" | "ok">("loading");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { user?: { role?: string } }) => {
        if (cancelled) return;
        const role = d.user?.role;
        if (role === "FINANCEIRO") {
          router.replace("/financeiro/eduia");
          return;
        }
        if (role === "PROFESSOR") {
          router.replace("/docente/eduia");
          return;
        }
        setGate("ok");
      })
      .catch(() => {
        if (!cancelled) setGate("ok");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (gate !== "ok") {
    return <EduiaLoadingShell />;
  }

  return (
    <DashboardLayout>
      <Header
        titleKey="page.eduia.title"
        descriptionKey="page.eduia.description"
      />
      <div className="space-y-4 p-6 pb-12">
        <EduiaHubBody initialPrompt={initialAi} />
      </div>
    </DashboardLayout>
  );
}

export default function EduiaSchoolPage() {
  return (
    <Suspense fallback={null}>
      <EduiaSchoolInner />
    </Suspense>
  );
}
