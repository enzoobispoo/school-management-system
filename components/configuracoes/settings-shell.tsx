"use client";

import { ReactNode } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { SettingsNav } from "@/components/configuracoes/settings-nav";

interface SettingsShellProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingsShell({
  title,
  description,
  children,
}: SettingsShellProps) {
  return (
    <DashboardLayout>
      <Header title={title} description={description} />

      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-border bg-card p-4 text-card-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <SettingsNav />
          </aside>

          <section className="rounded-[28px] border border-border bg-card p-6 text-card-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            {children}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}