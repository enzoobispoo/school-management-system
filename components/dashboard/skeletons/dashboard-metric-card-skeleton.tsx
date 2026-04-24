"use client";

export function DashboardMetricCardSkeleton() {
  return (
    <div className="animate-pulse rounded-[24px] border border-black/5 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:border-border dark:bg-card">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="h-4 w-24 rounded-md bg-black/5 dark:bg-muted" />
          <div className="mt-3 h-8 w-28 rounded-md bg-black/5 dark:bg-muted" />
        </div>

        <div className="h-10 w-10 shrink-0 rounded-2xl bg-black/5 dark:bg-muted" />
      </div>

      <div className="space-y-2">
        <div className="h-4 w-32 rounded-md bg-black/5 dark:bg-muted" />
        <div className="h-3 w-24 rounded-md bg-black/5 dark:bg-muted" />
      </div>
    </div>
  );
}