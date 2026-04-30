import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  label: string;
  tone?: "default" | "success" | "warning" | "danger" | "muted";
  className?: string;
}

const toneClasses: Record<NonNullable<StatusBadgeProps["tone"]>, string> = {
  default: "border-border bg-card text-foreground",
  success: "border-border bg-muted/40 text-foreground/75",
  warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
  danger: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400",
  muted: "border-border bg-muted text-muted-foreground",
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