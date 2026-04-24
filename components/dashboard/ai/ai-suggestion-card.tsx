"use client";

interface AiSuggestionCardProps {
  prompt: string;
  label?: string;
  onClick: (prompt: string) => void;
  variant?: "grid" | "list";
}

export function AiSuggestionCard({
  prompt,
  label,
  onClick,
  variant = "list",
}: AiSuggestionCardProps) {
  if (variant === "grid") {
    return (
      <button
        onClick={() => onClick(prompt)}
        className="
          h-[110px] rounded-2xl border border-border bg-card p-4 text-left
          flex flex-col justify-between
          shadow-sm transition-all duration-200
          hover:bg-primary hover:text-primary-foreground
        "
      >
        <span className="text-sm font-medium leading-5 line-clamp-2 text-inherit">
          {prompt}
        </span>

        {label ? (
          <span className="text-xs text-inherit opacity-60">
            {label}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <button
      onClick={() => onClick(prompt)}
      className="
        w-full rounded-full border border-border bg-card px-4 py-2.5 text-left
        text-sm font-medium text-foreground
        shadow-sm transition-all duration-200
        hover:bg-primary hover:text-primary-foreground
      "
    >
      {prompt}
    </button>
  );
}