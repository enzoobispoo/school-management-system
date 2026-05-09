"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { AiMessage } from "@/hooks/dashboard/use-dashboard-ai";
import { AiSuggestionCard } from "@/components/dashboard/ai/ai-suggestion-card";
import { sanitizeProfessorAiDisplayText } from "@/lib/ai/sanitize-professor-ai-display";

interface AiChatMessageProps {
  message: AiMessage;
  typingRef?: React.MutableRefObject<boolean>;
  setIsTyping?: (value: boolean) => void;
  onSelectSuggestion?: (prompt: string) => void;
  onTypingProgress?: () => void;
  /** Esconde jargão técnico (nomes internos de ferramentas, rodapé “Fontes” mono). */
  professorFriendlyUi?: boolean;
}

function useTypewriter(
  text: string,
  enabled: boolean,
  typingRef?: React.MutableRefObject<boolean>,
  setIsTyping?: (value: boolean) => void,
  speed = 14
) {
  const [displayedText, setDisplayedText] = useState(enabled ? "" : text);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      return;
    }

    setDisplayedText("");

    if (typingRef) {
      typingRef.current = true;
    }
    setIsTyping?.(true);

    let currentIndex = 0;

    intervalRef.current = window.setInterval(() => {
      if (typingRef && typingRef.current === false) {
        setIsTyping?.(false);

        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
        }

        return;
      }

      currentIndex += 1;
      setDisplayedText(text.slice(0, currentIndex));

      if (currentIndex >= text.length) {
        if (typingRef) {
          typingRef.current = false;
        }
        setIsTyping?.(false);

        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
        }
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [text, enabled, typingRef, setIsTyping, speed]);

  return displayedText;
}

export function AiChatMessage({
  message,
  typingRef,
  setIsTyping,
  onSelectSuggestion,
  onTypingProgress,
  professorFriendlyUi = false,
}: AiChatMessageProps) {
  const isUser = message.role === "user";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const shouldAnimateText = useMemo(() => !isUser, [isUser]);

  const assistantDisplaySource = useMemo(() => {
    if (isUser || !professorFriendlyUi) return message.content;
    return sanitizeProfessorAiDisplayText(message.content);
  }, [isUser, professorFriendlyUi, message.content]);

  const animatedContent = useTypewriter(
    assistantDisplaySource,
    shouldAnimateText,
    typingRef,
    setIsTyping,
    14
  );

  const animationFinished =
    animatedContent.length >= assistantDisplaySource.length;

  useEffect(() => {
    if (!isUser) {
      onTypingProgress?.();
    }
  }, [animatedContent, isUser, onTypingProgress]);

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex w-full transition-all duration-300 ease-out",
          isUser ? "justify-end" : "justify-start",
          visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        )}
      >
        <div
          className={cn(
            "max-w-[90%] rounded-[24px] px-4 py-3 text-sm leading-6",
            isUser
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-transparent text-foreground"
          )}
        >
          <div className="whitespace-pre-wrap break-words leading-6">
            {isUser ? message.content : animatedContent}
            {!isUser && !animationFinished ? (
              <span className="ml-1 inline-block h-4 w-0.5 animate-pulse rounded-full bg-muted-foreground align-middle" />
            ) : null}
          </div>
        </div>
      </div>

      {!isUser &&
      animationFinished &&
      onSelectSuggestion &&
      message.suggestions &&
      message.suggestions.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {message.suggestions.map((suggestion) => (
            <AiSuggestionCard
              key={`${message.id}-${suggestion.prompt}`}
              prompt={suggestion.prompt}
              label={suggestion.label}
              onClick={onSelectSuggestion}
              variant="grid"
            />
          ))}
        </div>
      ) : null}

      {!isUser &&
      animationFinished &&
      !professorFriendlyUi &&
      (message.meta?.toolsUsed?.length || message.meta?.correlationId) ? (
        <div className="max-w-[90%] rounded-xl border border-dashed border-border/70 bg-muted/30 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground/80">Transparência · </span>
          Recomendações com base nos dados consultados no sistema (não são garantias).
          {message.meta?.toolsUsed && message.meta.toolsUsed.length > 0 ? (
            <>
              {" "}
              Fontes:{" "}
              <span className="font-mono text-[10px] text-foreground/70">
                {message.meta.toolsUsed.join(", ")}
              </span>
              .
            </>
          ) : null}
          {message.meta?.correlationId ? (
            <>
              {" "}
              Correlação para suporte:{" "}
              <span className="break-all font-mono text-[10px] text-foreground/70">
                {message.meta.correlationId}
              </span>
              .
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}