"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { DocenteEduiaSidePanel } from "@/components/docente/docente-eduia-side-panel";

function DocenteEduiaPageInner() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("ai")?.trim() ?? "";

  return (
    <DashboardLayout>
      <section className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden lg:h-dvh">
        <div className="shrink-0">
          <Header
            title="EduIA · Workspace docente"
            description="Assistente contextual — turmas titulares, avisos e avaliações."
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-6 pb-8 pt-2">
          <DocenteEduiaSidePanel
            layout="page"
            chrome="minimal"
            className="min-h-0 flex-1"
            initialPrompt={initialPrompt}
          />
        </div>
      </section>
    </DashboardLayout>
  );
}

export default function DocenteEduiaPage() {
  return (
    <Suspense fallback={null}>
      <DocenteEduiaPageInner />
    </Suspense>
  );
}
