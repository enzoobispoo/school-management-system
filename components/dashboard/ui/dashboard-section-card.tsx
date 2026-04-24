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
        "rounded-[28px] border border-black/5 bg-white text-black shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200",
        "dark:border-border dark:bg-card dark:text-card-foreground",

        "p-6 data-[density=compact]:p-4",
        className
      )}
    >
      {children}
    </div>
  );
}