"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { AiFloatingButton } from "@/components/dashboard/ai/ai-floating-button";
import { NotificationsInboxProvider } from "@/components/providers/notifications-inbox-provider";
import { DashboardSessionProvider } from "@/components/providers/dashboard-session-provider";

interface DashboardLayoutProps {
  children: React.ReactNode;
  /** Oculta o assistente (telas que não devem carregar o copiloto). */
  hideAiAssistant?: boolean;
}

export function DashboardLayout({
  children,
  hideAiAssistant = false,
}: DashboardLayoutProps) {
  return (
    <NotificationsInboxProvider>
      <DashboardSessionProvider>
        <DashboardLayoutShell hideAiAssistant={hideAiAssistant}>
          {children}
        </DashboardLayoutShell>
      </DashboardSessionProvider>
    </NotificationsInboxProvider>
  );
}

function DashboardLayoutShell({
  children,
  hideAiAssistant,
}: {
  children: React.ReactNode;
  hideAiAssistant: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  const [professorRole, setProfessorRole] = useState(false);

  const professorDocenteHub =
    professorRole && pathname.startsWith("/docente");

  const hideFloatingAiChrome =
    pathname === "/eduia" ||
    pathname.startsWith("/financeiro/eduia") ||
    pathname === "/docente/eduia";

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.role === "PROFESSOR") setProfessorRole(true);
      })
      .catch(() => {});
  }, []);

  const hideAi = hideAiAssistant || hideFloatingAiChrome;

  return (
    <div className="min-h-screen bg-background text-foreground">
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

      {!hideAi && pathname !== "/docente/eduia" ? (
        <AiFloatingButton
          forceFloatingDesktop={false}
          visibility={professorDocenteHub ? "below-xl" : "below-lg"}
          embeddedVariant={
            professorDocenteHub ? "professor" : "executive"
          }
        />
      ) : null}
    </div>
  );
}