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
          h-[110px] rounded-2xl border border-black/5 bg-white p-4 text-left
          flex flex-col justify-between
          shadow-sm transition-all duration-200
          hover:bg-black hover:text-white
        "
      >
        <span className="text-sm font-medium leading-5 line-clamp-2">
          {prompt}
        </span>

        {label ? (
          <span className="text-xs text-black/40 group-hover:text-white/60">
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
        w-full rounded-full border border-black/10 bg-white px-4 py-2.5 text-left
        text-sm font-medium text-black
        shadow-sm transition-all duration-200
        hover:border-black/20 hover:bg-black hover:text-white
      "
    >
      {prompt}
    </button>
  );
}