"use client";

import { useState } from "react";
import { AiAssistantPanel } from "@/components/dashboard/ai-assistant-panel";

export function AiFloatingButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white shadow-lg"
        >
          IA
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 bg-white lg:hidden">
          <div className="flex h-full flex-col px-3 pt-[max(12px,env(safe-area-inset-top))] pb-[max(16px,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between border-b border-black/5 px-3 py-4">
              <span className="text-sm font-semibold text-black">
                Assistente IA
              </span>

              <button
                onClick={() => setOpen(false)}
                className="rounded-full px-2 py-1 text-sm text-black/75 transition hover:bg-black/[0.03]"
              >
                Fechar
              </button>
            </div>

            <div className="min-h-0 flex-1 py-3">
              <AiAssistantPanel embedded />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}