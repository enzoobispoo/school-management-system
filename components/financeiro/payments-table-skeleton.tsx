"use client";

export function PaymentsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#1a1a1a]">
      <div className="hidden grid-cols-[1.4fr_1.4fr_0.9fr_0.9fr_0.9fr_0.9fr] gap-4 border-b border-black/5 px-5 py-4 md:grid dark:border-white/10">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-4 animate-pulse rounded-full bg-black/[0.05] dark:bg-white/10"
          />
        ))}
      </div>

      <div className="divide-y divide-black/5 dark:divide-white/10">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="grid gap-4 px-5 py-4 md:grid-cols-[1.4fr_1.4fr_0.9fr_0.9fr_0.9fr_0.9fr]"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-black/[0.05] dark:bg-white/10" />
              <div className="flex-1">
                <div className="h-4 w-28 animate-pulse rounded-full bg-black/[0.05] dark:bg-white/10" />
                <div className="mt-2 h-3 w-20 animate-pulse rounded-full bg-black/[0.05] dark:bg-white/10" />
              </div>
            </div>

            <div className="h-4 w-40 animate-pulse rounded-full bg-black/[0.05] dark:bg-white/10" />
            <div className="h-4 w-20 animate-pulse rounded-full bg-black/[0.05] dark:bg-white/10" />
            <div className="h-6 w-24 animate-pulse rounded-full bg-black/[0.05] dark:bg-white/10" />
            <div className="h-4 w-20 animate-pulse rounded-full bg-black/[0.05] dark:bg-white/10" />
            <div className="h-9 w-24 animate-pulse rounded-2xl bg-black/[0.05] dark:bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}