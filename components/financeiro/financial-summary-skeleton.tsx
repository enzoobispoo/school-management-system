"use client";

export function FinancialSummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#1a1a1a]"
        >
          <div className="h-4 w-28 animate-pulse rounded-full bg-black/[0.05] dark:bg-white/10" />
          <div className="mt-4 h-8 w-36 animate-pulse rounded-full bg-black/[0.05] dark:bg-white/10" />
          <div className="mt-3 h-3 w-24 animate-pulse rounded-full bg-black/[0.05] dark:bg-white/10" />
        </div>
      ))}
    </div>
  );
}