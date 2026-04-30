"use client";

import { AiAssistantPanel } from "@/components/dashboard/ai/ai-assistant-panel";

interface DashboardRightPanelProps {
  initialPrompt?: string;
}

export function DashboardRightPanel({
  initialPrompt = "",
}: DashboardRightPanelProps) {
  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col rounded-[28px] border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] text-card-foreground">
      
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Assistente IA
        </h3>

        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          Beta
        </span>
      </div>

      <div className="min-h-0 flex-1">
        <AiAssistantPanel embedded initialPrompt={initialPrompt} />
      </div>
    </div>
  );
}