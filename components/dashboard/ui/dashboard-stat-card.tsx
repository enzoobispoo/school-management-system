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
    <div className="rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <p className="text-xs text-black/50">{label}</p>

      <p className="mt-2 text-2xl font-semibold tracking-tight text-black">
        {value}
      </p>

      {sub ? (
        <p className="mt-1 text-xs text-black/40">{sub}</p>
      ) : null}
    </div>
  );
}