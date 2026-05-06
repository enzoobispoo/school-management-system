"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { AiFloatingButton } from "@/components/dashboard/ai/ai-floating-button";
import { NotificationsInboxProvider } from "@/components/providers/notifications-inbox-provider";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <NotificationsInboxProvider>
      <DashboardLayoutShell>{children}</DashboardLayoutShell>
    </NotificationsInboxProvider>
  );
}

function DashboardLayoutShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />

      <main
        className={`pt-16 transition-[padding] duration-300 lg:pt-0 ${
          collapsed ? "lg:pl-[60px]" : "lg:pl-[220px]"
        }`}
      >
        {children}
      </main>

      <AiFloatingButton />
    </div>
  );
}