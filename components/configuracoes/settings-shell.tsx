"use client";

import { ReactNode } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { SettingsNav } from "@/components/configuracoes/settings-nav";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

interface SettingsShellProps {
  title?: string;
  description?: string;
  titleKey?: string;
  descriptionKey?: string;
  children: ReactNode;
}

export function SettingsShell({
  title,
  description,
  titleKey,
  descriptionKey,
  children,
}: SettingsShellProps) {
  const { t } = useDashboardLanguage();
  const resolvedTitle =
    titleKey ? t(titleKey) : title ?? t("settings.shell.title");
  const resolvedDescription =
    descriptionKey ? t(descriptionKey) : description;

  return (
    <DashboardLayout>
      <Header title={resolvedTitle} description={resolvedDescription} />

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
