"use client";

import type { DashboardAiMessage } from "@/hooks/dashboard/use-dashboard-ai";

interface AiChatMessageProps {
  message: DashboardAiMessage;
}

export function AiChatMessage({ message }: AiChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={
          isUser
            ? "max-w-[90%] rounded-2xl bg-black px-4 py-3 text-sm text-white"
            : "max-w-[90%] rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm text-black/75"
        }
      >
        {message.content}
      </div>
    </div>
  );
}