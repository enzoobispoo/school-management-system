"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { AiMessage } from "@/hooks/dashboard/use-dashboard-ai";
import { AiSuggestionCard } from "@/components/dashboard/ai/ai-suggestion-card";

interface AiChatMessageProps {
  message: AiMessage;
  onSelectSuggestion?: (prompt: string) => void;
  onTypingProgress?: () => void;
}

function useTypewriter(text: string, enabled: boolean, speed = 14) {
  const [displayedText, setDisplayedText] = useState(enabled ? "" : text);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      return;
    }

    setDisplayedText("");

    let currentIndex = 0;
    const interval = window.setInterval(() => {
      currentIndex += 1;
      setDisplayedText(text.slice(0, currentIndex));

      if (currentIndex >= text.length) {
        window.clearInterval(interval);
      }
    }, speed);

    return () => window.clearInterval(interval);
  }, [text, enabled, speed]);

  return displayedText;
}

export function AiChatMessage({
  message,
  onSelectSuggestion,
  onTypingProgress,
}: AiChatMessageProps) {
  const isUser = message.role === "user";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const shouldAnimateText = useMemo(() => !isUser, [isUser]);

  const animatedContent = useTypewriter(
    message.content,
    shouldAnimateText,
    14
  );

  const animationFinished = animatedContent.length >= message.content.length;

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
            "max-w-[90%] rounded-[24px] px-4 py-3 text-sm leading-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
            isUser
              ? "bg-black text-white"
              : "border border-black/5 bg-white text-black"
          )}
        >
          <div className="whitespace-pre-wrap break-words leading-6">
            {isUser ? message.content : animatedContent}
            {!isUser && !animationFinished ? (
              <span className="ml-1 inline-block h-4 w-[2px] animate-pulse rounded-full bg-black/70 align-middle" />
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
    </div>
  );
}