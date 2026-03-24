"use client";

import { cn } from "@/lib/utils";

interface DashboardSectionCardProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardSectionCard({
  children,
  className,
}: DashboardSectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      {children}
    </div>
  );
}