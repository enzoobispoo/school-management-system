"use client";

import { useState } from "react";

export interface DashboardAiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface DashboardAiResponse {
  message?: string;
  error?: string;
}

function createMessage(
  role: DashboardAiMessage["role"],
  content: string
): DashboardAiMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
  };
}

export function useDashboardAi() {
  const [messages, setMessages] = useState<DashboardAiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(overrideText?: string) {
    const text = (overrideText ?? input).trim();

    if (!text || loading) return;

    const userMessage = createMessage("user", text);

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      setLoading(true);

      const response = await fetch("/api/ai/dashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          history: messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const result: DashboardAiResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "EduIA não está disponivel no momento. Entre em contato com Enzo para mais informações."
        );
      }

      const assistantText =
        result.message?.trim() ||
        "Não foi possível gerar uma resposta no momento.";

      const assistantMessage = createMessage("assistant", assistantText);

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const fallbackMessage = createMessage(
        "assistant",
        error instanceof Error
          ? error.message
          : "EduIA não está disponivel no momento. Entre em contato com Enzo para mais informações."
      );

      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setLoading(false);
    }
  }

  return {
    messages,
    input,
    setInput,
    loading,
    sendMessage,
  };
}