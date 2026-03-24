"use client";

import { Button } from "@/components/ui/button";

interface DashboardPageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function DashboardPageHeader({
  title,
  description,
  action,
}: DashboardPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div>
        {description ? (
          <p className="text-sm text-black/45">{description}</p>
        ) : null}

        <h1 className="text-[34px] font-semibold tracking-[-0.04em] text-black">
          {title}
        </h1>
      </div>

      {action}
    </div>
  );
}