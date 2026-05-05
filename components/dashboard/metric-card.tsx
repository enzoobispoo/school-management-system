"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  secondaryInfo?: string;
  icon: LucideIcon;
  iconColor?: string;
  href?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  secondaryInfo,
  icon: Icon,
  iconColor,
  href,
}: MetricCardProps) {
  const content = (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card px-5 py-4 transition-all duration-150",
        href && "cursor-pointer hover:border-border hover:bg-card/80"
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-[13px] text-muted-foreground">{title}</p>
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/60",
            iconColor
          )}
        >
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>

      <p className="text-[22px] font-semibold tracking-tight text-foreground">
        {value}
      </p>

      <div className="mt-2 space-y-0.5">
        {change ? (
          <p
            className={cn(
              "text-[12px] font-medium",
              changeType === "positive" && "text-emerald-600 dark:text-emerald-400",
              changeType === "negative" && "text-red-500 dark:text-red-400",
              changeType === "neutral" && "text-muted-foreground"
            )}
          >
            {change}
          </p>
        ) : null}
        {secondaryInfo ? (
          <p className="text-[12px] text-muted-foreground">{secondaryInfo}</p>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
}
