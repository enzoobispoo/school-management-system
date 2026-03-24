import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  label: string;
  tone?: "default" | "success" | "warning" | "danger" | "muted";
  className?: string;
}

const toneClasses: Record<NonNullable<StatusBadgeProps["tone"]>, string> = {
  default: "border-black/10 bg-white text-black",
  success: "border-black/10 bg-black/[0.04] text-black/75",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  muted: "border-zinc-200 bg-zinc-50 text-zinc-600",
};

export function StatusBadge({
  label,
  tone = "default",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
    >
      {label}
    </span>
  );
}