"use client";

import { useState } from "react";
import { AiAssistantPanel } from "@/components/dashboard/ai/ai-assistant-panel";
import { EduiaDiagnosticsCard } from "@/components/dashboard/eduia-diagnostics-card";

export function EduiaHubBody({ initialPrompt = "" }: { initialPrompt?: string }) {
  const [queuedPrompt, setQueuedPrompt] = useState<
    { nonce: number; prompt: string } | undefined
  >(undefined);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] xl:items-start">
      <AiAssistantPanel
        embedded={false}
        variant="executive"
        initialPrompt={initialPrompt}
        dashboardMetrics={null}
        dashboardMetricsLoading={false}
        dashboardMetricsError={false}
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
