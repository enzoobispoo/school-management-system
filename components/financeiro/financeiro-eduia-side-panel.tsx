"use client";

import Link from "next/link";
import { Maximize2 } from "lucide-react";
import { AiAssistantPanel } from "@/components/dashboard/ai/ai-assistant-panel";
import { EduiaPanelShell } from "@/components/dashboard/ai/eduia-panel-shell";
import { Button } from "@/components/ui/button";

type FinanceiroEduiaSidePanelProps = {
  initialPrompt?: string;
  submitQueuedPrompt?: { nonce: number; prompt: string };
  layout?: "sidebar" | "page";
  chrome?: "full" | "minimal";
  className?: string;
};

export function FinanceiroEduiaSidePanel({
  initialPrompt = "",
  submitQueuedPrompt,
  layout = "sidebar",
  chrome = "full",
  className,
}: FinanceiroEduiaSidePanelProps) {
  const maximizeAction =
    layout === "sidebar" ?
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
        asChild
        title="Abrir em tela cheia"
      >
        <Link href="/financeiro/eduia">
          <Maximize2 className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      </Button>
    : null;

  return (
    <EduiaPanelShell
      layout={layout}
      chrome={chrome}
      className={className}
      headerAction={maximizeAction}
    >
      <AiAssistantPanel
        embedded
        variant="executive"
        initialPrompt={initialPrompt}
        submitQueuedPrompt={submitQueuedPrompt}
      />
    </EduiaPanelShell>
  );
}
