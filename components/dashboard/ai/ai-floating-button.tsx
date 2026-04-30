"use client";

import { useState } from "react";
import { AiAssistantPanel } from "@/components/dashboard/ai/ai-assistant-panel";

export function AiFloatingButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white shadow-lg dark:bg-white/10 dark:backdrop-blur-md"
        >
          IA
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 bg-background lg:hidden">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <span className="font-semibold text-foreground">Assistente IA</span>
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Fechar
              </button>
            </div>

            <div className="min-h-0 flex-1 p-3">
              <AiAssistantPanel embedded />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}