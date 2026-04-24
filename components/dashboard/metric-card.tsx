"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
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
        "rounded-[24px] border border-black/5 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all dark:border-border dark:bg-card dark:text-card-foreground",
        href &&
          "group cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-black/42 dark:text-muted-foreground">
            {title}
          </p>

          <p className="mt-1 text-[26px] font-semibold tracking-[-0.04em] text-black dark:text-foreground">
            {value}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {href ? (
            <ChevronRight className="h-4 w-4 text-black/25 transition-transform group-hover:translate-x-0.5 dark:text-muted-foreground" />
          ) : null}

          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fafafa] text-black dark:bg-muted dark:text-foreground",
              iconColor
            )}
          >
            <Icon className="h-[18px] w-[18px] text-current" />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        {change ? (
          <p
            className={cn(
              "text-xs font-medium",
              changeType === "positive" &&
                "text-emerald-600 dark:text-emerald-400",
              changeType === "negative" &&
                "text-amber-600 dark:text-amber-400",
              changeType === "neutral" &&
                "text-black/60 dark:text-muted-foreground"
            )}
          >
            {change}
          </p>
        ) : null}

        {secondaryInfo ? (
          <p className="text-xs text-black/40 dark:text-muted-foreground">
            {secondaryInfo}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}