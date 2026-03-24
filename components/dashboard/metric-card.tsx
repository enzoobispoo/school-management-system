"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType?: "positive" | "negative" | "neutral";
  secondaryInfo?: string;
  icon: LucideIcon;
  iconColor?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  secondaryInfo,
  icon: Icon,
  iconColor,
}: MetricCardProps) {
  return (
    <div className="rounded-[24px] border border-black/[0.05] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-black/42">{title}</p>
          <p className="mt-1 text-[26px] font-semibold tracking-[-0.04em] text-black">
            {value}
          </p>
        </div>

        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black/[0.04] text-black",
            iconColor
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>

      <div className="space-y-1">
        <p
          className={cn(
            "text-sm font-medium",
            changeType === "positive" && "text-emerald-600",
            changeType === "negative" && "text-amber-600",
            changeType === "neutral" && "text-black/58"
          )}
        >
          {change}
        </p>

        {secondaryInfo ? (
          <p className="text-xs text-black/38">{secondaryInfo}</p>
        ) : null}
      </div>
    </div>
  );
}