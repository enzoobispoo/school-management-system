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
        "rounded-xl border border-border/60 bg-card text-card-foreground transition-all duration-150",
        "p-5 data-[density=compact]:p-4",
        className
      )}
    >
      {children}
    </div>
  );
}