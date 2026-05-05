"use client";

import { AiAssistantPanel } from "@/components/dashboard/ai/ai-assistant-panel";

interface DashboardRightPanelProps {
  initialPrompt?: string;
}

export function DashboardRightPanel({
  initialPrompt = "",
}: DashboardRightPanelProps) {
  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col rounded-xl border border-border/60 bg-card p-4 text-card-foreground">
      
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-foreground">Assistente IA</h3>
        <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          Beta
        </span>
      </div>

      <div className="min-h-0 flex-1">
        <AiAssistantPanel embedded initialPrompt={initialPrompt} />
      </div>
    </div>
  );
}