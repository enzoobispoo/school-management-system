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