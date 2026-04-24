"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AiChatMessage } from "@/components/dashboard/ai/ai-chat-message";
import { AiQuickPrompts } from "@/components/dashboard/ai/ai-quick-prompts";
import { useDashboardAi } from "@/hooks/dashboard/use-dashboard-ai";

interface AiAssistantPanelProps {
  embedded?: boolean;
  initialPrompt?: string;
}

export function AiAssistantPanel({
  embedded = false,
  initialPrompt = "",
}: AiAssistantPanelProps) {
  const router = useRouter();
  const {
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
  } = useDashboardAi();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const hasSentInitialPrompt = useRef(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({
      behavior,
      block: "end",
    });
  }, []);

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (!initialPrompt.trim()) return;
    if (hasSentInitialPrompt.current) return;

    hasSentInitialPrompt.current = true;
    sendMessage(initialPrompt);

    const url = new URL(window.location.href);
    url.searchParams.delete("ai");
    router.replace(url.pathname + url.search);
  }, [initialPrompt, sendMessage, router]);

  return (
    <div
      className={
        embedded
          ? "flex h-full min-h-0 flex-col"
          : "flex min-h-[520px] flex-col rounded-[28px] border border-border bg-card p-5 text-card-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      }
    >
      {!embedded ? (
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Assistente IA
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Pergunte e execute ações do sistema.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={clearMessages}
          >
            Limpar
          </Button>
        </div>
      ) : null}

      <div className={embedded ? "mb-4 px-1" : "mb-4"}>
        <h4 className="text-[26px] font-semibold leading-8 tracking-[-0.04em] text-foreground">
          Como posso ajudar?
        </h4>
        <p className="mt-2 text-sm text-muted-foreground">
          Pergunte sobre alunos, pagamentos, cursos ou eventos.
        </p>
      </div>

      {messages.length === 0 ? (
        <div className={embedded ? "mb-4 px-1" : "mb-4"}>
          <AiQuickPrompts onSelect={sendMessage} />
        </div>
      ) : null}

      <div
        className={
          embedded
            ? "min-h-0 flex-1 overflow-y-auto rounded-[24px] border border-border bg-muted/40 p-4"
            : "min-h-0 flex-1 overflow-y-auto rounded-[24px] bg-muted/40 p-4"
        }
      >
        <div className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Comece com uma pergunta ou use uma das sugestões acima.
            </p>
          ) : (
            messages.map((message) => (
              <AiChatMessage
                key={message.id}
                message={message}
                typingRef={typingRef}
                setIsTyping={setIsTyping}
                onSelectSuggestion={sendMessage}
                onTypingProgress={() => scrollToBottom("auto")}
              />
            ))
          )}

          {loading ? (
            <div className="max-w-[90%] rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              Pensando...
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div
        className={embedded ? "mt-4 flex gap-2 px-1 pb-1" : "mt-4 flex gap-2"}
      >
        <Input
          placeholder="Ex: quantos alunos eu tenho?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="h-11 rounded-2xl"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading && !isTyping) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        {loading || isTyping ? (
          <Button
            onClick={stopResponse}
            className="h-11 w-11 shrink-0 rounded-2xl bg-primary text-primary-foreground hover:opacity-90"
          >
            <span className="block h-3 w-3 rounded-[2px] bg-current" />
          </Button>
        ) : (
          <Button
            onClick={() => sendMessage()}
            className="h-11 shrink-0 rounded-2xl px-5"
          >
            Enviar
          </Button>
        )}
      </div>
    </div>
  );
}