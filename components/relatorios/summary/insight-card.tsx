"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

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
    <Card className="rounded-[24px] border border-black/[0.05] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-black/45">
            {title}
          </CardTitle>

          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="text-2xl font-semibold tracking-tight text-black">
          {value}
        </div>
        <p className="mt-1 text-xs text-black/50">{description}</p>
      </CardContent>
    </Card>
  );
}