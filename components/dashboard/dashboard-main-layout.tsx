"use client";

interface DashboardMainLayoutProps {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
}

export function DashboardMainLayout({
  children,
  rightPanel,
}: DashboardMainLayoutProps) {
  return (
    <div className="p-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">{children}</div>

        <div className="hidden min-h-0 xl:block">{rightPanel}</div>
      </div>
    </div>
  );
}