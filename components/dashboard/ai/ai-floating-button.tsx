"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AiAssistantPanel } from "@/components/dashboard/ai/ai-assistant-panel";

interface AiFloatingButtonProps {
  /** Mantém o FAB também em telas grandes (legado / fallback). */
  forceFloatingDesktop?: boolean;
  /** Esconde o FAB a partir do breakpoint (painel lateral visível no xl docente). */
  visibility?: "below-lg" | "below-xl";
  embeddedVariant?: "executive" | "professor";
}

export function AiFloatingButton({
  forceFloatingDesktop = false,
  visibility = "below-lg",
  embeddedVariant = "executive",
}: AiFloatingButtonProps) {
  const [open, setOpen] = useState(false);

  const hideFrom =
    forceFloatingDesktop ? ""
    : visibility === "below-xl" ? "xl:hidden"
    : "lg:hidden";

  return (
    <>
      <div className={cn("fixed bottom-4 right-4 z-50", hideFrom)}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
        >
          EduIA
        </button>
      </div>

      {open ? (
        <div className={cn("fixed inset-0 z-50 bg-background", hideFrom)}>
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <span className="font-semibold text-foreground">EduIA</span>
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Fechar
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden p-3">
              <AiAssistantPanel
                embedded
                variant={embeddedVariant}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}