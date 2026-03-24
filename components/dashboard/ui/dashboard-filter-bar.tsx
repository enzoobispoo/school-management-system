"use client";

interface DashboardFilterBarProps {
  children: React.ReactNode;
}

export function DashboardFilterBar({ children }: DashboardFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}
    </div>
  );
}