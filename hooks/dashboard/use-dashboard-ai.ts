"use client";

import { useCallback, useRef, useState } from "react";

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
    conversationContext?: Record<string, unknown>;
  };
}

type ConversationMessagePayload = {
  role: "user" | "assistant";
  content: string;
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildConversationHistory(
  messages: AiMessage[]
): ConversationMessagePayload[] {
  return messages.slice(-10).map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

function getLatestConversationContext(messages: AiMessage[]) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const context = messages[i]?.meta?.conversationContext;
    if (context) return context;
  }
  return null;
}

export function useDashboardAi() {
  const controllerRef = useRef<AbortController | null>(null);
  const typingRef = useRef(false);
  const stoppedRef = useRef(false);

  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(
    async (customMessage?: string) => {
      const content = (customMessage ?? input).trim();

      if (!content || loading || isTyping) return;

      stoppedRef.current = false;

      const userMessage: AiMessage = {
        id: createId(),
        role: "user",
        content,
      };

      const nextMessages = [...messages, userMessage];
      const latestConversationContext = getLatestConversationContext(messages);

      setMessages(nextMessages);
      setInput("");
      setLoading(true);

      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const response = await fetch("/api/ai/dashboard", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            message: content,
            messages: buildConversationHistory(nextMessages),
            conversationContext: latestConversationContext,
          }),
        });

        const result = await response.json();

        if (stoppedRef.current) {
          return;
        }

        if (!response.ok) {
          throw new Error(
            result?.error || "Não foi possível obter uma resposta da EduIA."
          );
        }

        typingRef.current = true;
        setIsTyping(true);

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
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        if (stoppedRef.current) {
          return;
        }

        console.error("Erro ao enviar mensagem para a EduIA:", error);

        const assistantMessage: AiMessage = {
          id: createId(),
          role: "assistant",
          content:
            "Tive um problema ao responder agora. Tente novamente em instantes.",
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } finally {
        controllerRef.current = null;
        setLoading(false);
      }
    },
    [input, loading, isTyping, messages]
  );

  const stopResponse = useCallback(() => {
    stoppedRef.current = true;

    controllerRef.current?.abort();
    controllerRef.current = null;

    typingRef.current = false;
    setLoading(false);
    setIsTyping(false);
  }, []);

  const clearMessages = useCallback(() => {
    stoppedRef.current = false;
    controllerRef.current?.abort();
    controllerRef.current = null;

    setMessages([]);
    typingRef.current = false;
    setIsTyping(false);
    setLoading(false);
  }, []);

  return {
    messages,
    input,
    setInput,
    loading,
    isTyping,
    sendMessage,
    stopResponse,
    clearMessages,
    typingRef,
    setIsTyping,
  };
}