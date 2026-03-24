"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface FinancialSummaryCardProps {
  title: string;
  value: string;
  change: string;
  changeType?: "positive" | "negative" | "neutral";
  secondaryInfo?: string;
  icon: LucideIcon;
  iconBg: string;
}

export function FinancialSummaryCard({
  title,
  value,
  change,
  changeType = "neutral",
  secondaryInfo,
  icon: Icon,
  iconBg,
}: FinancialSummaryCardProps) {
  return (
    <Card className="rounded-[24px] border border-black/[0.05] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-black/45">
              {title}
            </span>

            <span className="text-2xl font-semibold tracking-tight text-black">
              {value}
            </span>

            <span
              className={cn(
                "text-xs font-medium",
                changeType === "positive" && "text-black/65",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-black/55"
              )}
            >
              {change}
            </span>

            {secondaryInfo ? (
              <div className="mt-1 inline-flex w-fit items-center rounded-md bg-black/[0.04] px-2 py-1 text-xs text-black/55">
                {secondaryInfo}
              </div>
            ) : null}
          </div>

          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              iconBg
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}