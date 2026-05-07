"use client";

import { cn } from "@/lib/utils";

export type AiSuggestionJarvisAccent =
  | "violet"
  | "amber"
  | "sky"
  | "emerald"
  | "rose";

const jarvisAccentClass: Record<AiSuggestionJarvisAccent, string> = {
  violet:
    "border-violet-500/15 bg-violet-500/[0.07] hover:bg-violet-500/[0.11] dark:border-violet-400/20 dark:bg-violet-400/[0.09]",
  amber:
    "border-amber-500/15 bg-amber-500/[0.07] hover:bg-amber-500/[0.11] dark:border-amber-400/20 dark:bg-amber-400/[0.09]",
  sky: "border-sky-500/15 bg-sky-500/[0.07] hover:bg-sky-500/[0.11] dark:border-sky-400/20 dark:bg-sky-400/[0.09]",
  emerald:
    "border-emerald-500/15 bg-emerald-500/[0.07] hover:bg-emerald-500/[0.11] dark:border-emerald-400/20 dark:bg-emerald-400/[0.09]",
  rose: "border-rose-500/15 bg-rose-500/[0.07] hover:bg-rose-500/[0.11] dark:border-rose-400/20 dark:bg-rose-400/[0.09]",
};

interface AiSuggestionCardProps {
  prompt: string;
  label?: string;
  onClick: (prompt: string) => void;
  variant?: "grid" | "list" | "jarvis";
  jarvisAccent?: AiSuggestionJarvisAccent;
}

export function AiSuggestionCard({
  prompt,
  label,
  onClick,
  variant = "list",
  jarvisAccent = "violet",
}: AiSuggestionCardProps) {
  if (variant === "jarvis") {
    return (
      <button
        type="button"
        onClick={() => onClick(prompt)}
        className={cn(
          "w-full rounded-[22px] border px-4 py-3.5 text-left transition-colors",
          jarvisAccentClass[jarvisAccent]
        )}
      >
        {label ?
          <>
            <span className="text-[13px] font-semibold leading-snug text-foreground">
              {label}
            </span>
            <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground line-clamp-3">
              {prompt}
            </span>
          </>
        : <span className="text-[13px] font-medium leading-snug text-foreground">
            {prompt}
          </span>}
      </button>
    );
  }

  if (variant === "grid") {
    return (
      <button
        onClick={() => onClick(prompt)}
        className="h-[110px] rounded-2xl border border-border bg-transparent p-4 text-left flex flex-col justify-between transition-colors hover:bg-muted"
      >
        <span className="text-sm font-medium leading-5 line-clamp-2 text-foreground">
          {prompt}
        </span>
        {label ? (
          <span className="text-xs text-muted-foreground">{label}</span>
        ) : null}
      </button>
    );
  }

  return (
    <button
      onClick={() => onClick(prompt)}
      className="w-full rounded-2xl border border-border bg-transparent px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
    >
      {prompt}
    </button>
  );
}