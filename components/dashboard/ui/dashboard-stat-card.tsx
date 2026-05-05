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
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-[22px] font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {sub ? (
        <p className="mt-1 text-[12px] text-muted-foreground">{sub}</p>
      ) : null}
    </div>
  );
}