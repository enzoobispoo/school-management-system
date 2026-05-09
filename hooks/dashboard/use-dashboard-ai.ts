"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
    correlationId?: string;
    toolsUsed?: string[];
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

async function resolveAiEndpoint(): Promise<string> {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  const data = (await res.json()) as { user?: { role?: string } };
  /** Professor sempre usa rota docente — evita 403 do dashboard executivo se role vier indefinido num primeiro fetch. */
  if (data.user?.role === "PROFESSOR") return "/api/ai/docente";
  return "/api/ai/dashboard";
}

export type UseDashboardAiOptions = {
  /** Garante o endpoint correto (painel professor nunca chama `/api/ai/dashboard`). */
  forcedEndpoint?: "/api/ai/docente" | "/api/ai/dashboard";
  /** Opcional: persistir histórico neste aparelho quando o usuário ativa em Privacidade na UI. */
  persistConversationKey?: string | null;
};

export function useDashboardAi(options?: UseDashboardAiOptions) {
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const persistConversationKey = options?.persistConversationKey ?? null;

  const controllerRef = useRef<AbortController | null>(null);
  const correlationRef = useRef<string | null>(null);
  const typingRef = useRef(false);
  const stoppedRef = useRef(false);
  const endpointCacheRef = useRef<string | null>(null);

  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!persistConversationKey || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(persistConversationKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      const valid = parsed.every(
        (m) =>
          m &&
          typeof m === "object" &&
          typeof (m as AiMessage).id === "string" &&
          ((m as AiMessage).role === "user" ||
            (m as AiMessage).role === "assistant") &&
          typeof (m as AiMessage).content === "string"
      );
      if (!valid) return;
      setMessages(parsed as AiMessage[]);
    } catch {
      /* ignore */
    }
  }, [persistConversationKey]);

  useEffect(() => {
    if (!persistConversationKey || typeof window === "undefined") return;
    if (messages.length === 0) return;
    try {
      localStorage.setItem(
        persistConversationKey,
        JSON.stringify(messages.slice(-50))
      );
    } catch {
      /* quota */
    }
  }, [messages, persistConversationKey]);

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
        const forced = optionsRef.current?.forcedEndpoint;
        const endpoint =
          forced ??
          (endpointCacheRef.current ?? (await resolveAiEndpoint()));
        if (!forced) {
          endpointCacheRef.current = endpoint;
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(correlationRef.current
              ? { "x-correlation-id": correlationRef.current }
              : {}),
          },
          signal: controller.signal,
          body: JSON.stringify({
            message: content,
            messages: buildConversationHistory(nextMessages),
            conversationContext: latestConversationContext,
          }),
        });

        const rawBody = await response.text();
        let result: {
          message?: string;
          error?: string;
          suggestions?: unknown;
          meta?: AiMessage["meta"];
        } = {};

        if (rawBody.trim()) {
          try {
            result = JSON.parse(rawBody) as typeof result;
          } catch {
            throw new Error(
              response.ok
                ? "A EduIA retornou uma resposta inválida. Atualize a página e tente de novo."
                : `Erro ${response.status} ao falar com o servidor.`
            );
          }
        }

        if (stoppedRef.current) {
          return;
        }

        if (!response.ok) {
          if (response.status === 403 || response.status === 401) {
            endpointCacheRef.current = null;
          }
          throw new Error(
            result?.error ||
              "Não foi possível obter uma resposta da EduIA."
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

        let fallback =
          "Não consegui completar a resposta agora. Verifique sua conexão e tente de novo.";
        if (error instanceof Error) {
          const msg = error.message.trim();
          if (msg) fallback = msg;
          if (
            msg.includes("401") ||
            msg.includes("403") ||
            msg.toLowerCase().includes("não autenticado")
          ) {
            fallback =
              "Sua sessão pode ter expirado — atualize a página ou entre novamente.";
          }
          if (
            msg.includes("EDUIA_ROLE_RESTRICTED") ||
            msg.includes("perfil Professor")
          ) {
            fallback =
              "O assistente do gestor não está disponível no seu perfil. Use **Nova conversa** ou atualize a página — o chat do professor usa outra rota.";
          }
        }

        const assistantMessage: AiMessage = {
          id: createId(),
          role: "assistant",
          content: fallback,
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
    correlationRef.current = null;
    if (!optionsRef.current?.forcedEndpoint) {
      endpointCacheRef.current = null;
    }

    const pk = optionsRef.current?.persistConversationKey;
    if (pk && typeof window !== "undefined") {
      try {
        localStorage.removeItem(pk);
      } catch {
        /* ignore */
      }
    }

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