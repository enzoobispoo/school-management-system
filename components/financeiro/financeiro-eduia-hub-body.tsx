"use client";

import { useState } from "react";
import { EduiaDiagnosticsCard } from "@/components/dashboard/eduia-diagnostics-card";
import { FinanceiroEduiaSidePanel } from "@/components/financeiro/financeiro-eduia-side-panel";

export function FinanceiroEduiaHubBody({
  initialPrompt = "",
}: {
  initialPrompt?: string;
}) {
  const [queuedPrompt, setQueuedPrompt] = useState<
    { nonce: number; prompt: string } | undefined
  >(undefined);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] xl:items-start">
      <FinanceiroEduiaSidePanel
        layout="page"
        chrome="minimal"
        className="min-h-0 flex-1"
        initialPrompt={initialPrompt}
        submitQueuedPrompt={queuedPrompt}
      />
      <div className="space-y-3 xl:sticky xl:top-28 xl:self-start">
        <EduiaDiagnosticsCard
          onAppendToAssistant={(text) =>
            setQueuedPrompt({ nonce: Date.now(), prompt: text })
          }
        />
      </div>
    </div>
  );
}
