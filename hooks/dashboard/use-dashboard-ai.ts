"use client";

import { useState } from "react";

export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: Array<{
    label: string;
    prompt: string;
  }>;
  meta?: {
    intent?: string;
    confidence?: number;
    executed?: boolean;
  };
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useDashboardAi() {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(customMessage?: string) {
    const content = (customMessage ?? input).trim();

    if (!content || loading) return;

    const userMessage: AiMessage = {
      id: createId(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/dashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Não foi possível obter uma resposta da EduIA."
        );
      }

      const assistantMessage: AiMessage = {
        id: createId(),
        role: "assistant",
        content:
          result?.message || "Não foi possível gerar uma resposta no momento.",
        suggestions: Array.isArray(result?.suggestions)
          ? result.suggestions
          : [],
        meta: result?.meta,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erro ao enviar mensagem para a EduIA:", error);

      const assistantMessage: AiMessage = {
        id: createId(),
        role: "assistant",
        content:
          "Tive um problema ao responder agora. Tente novamente em instantes.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
    }
  }

  function clearMessages() {
    setMessages([]);
  }

  return {
    messages,
    input,
    setInput,
    loading,
    sendMessage,
    clearMessages,
  };
}