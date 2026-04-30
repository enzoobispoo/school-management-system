"use client";

interface DashboardStatCardProps {
  label: string;
  value: string;
  sub?: string;
}

export function DashboardStatCard({
  label,
  value,
  sub,
}: DashboardStatCardProps) {
  return (
    <div className="rounded-[26px] border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {sub ? (
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      ) : null}
    </div>
  );
}