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

      <div className="p-5">
        <div className="grid gap-5 lg:grid-cols-[200px_minmax(0,1fr)]">
          <aside className="rounded-xl border border-border/60 bg-card p-3 text-card-foreground">
            <SettingsNav />
          </aside>

          <section className="rounded-xl border border-border/60 bg-card p-6 text-card-foreground">
            {children}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}