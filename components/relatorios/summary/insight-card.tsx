"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InsightCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
}

export function InsightCard({
  title,
  value,
  description,
  icon: Icon,
  iconBg,
}: InsightCardProps) {
  return (
    <Card className="rounded-[24px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:border-white/10 dark:bg-[#1a1a1a]">
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          
          <CardTitle className="text-sm font-medium text-black/42 dark:text-white/60">
            {title}
          </CardTitle>

          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              iconBg
            )}
          >
            <Icon className="h-4 w-4 text-current" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="text-2xl font-semibold tracking-tight text-black dark:text-white">
          {value}
        </div>

        <p className="mt-1 text-xs text-black/42 dark:text-white/60">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}