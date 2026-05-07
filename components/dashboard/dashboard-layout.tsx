"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { AiFloatingButton } from "@/components/dashboard/ai/ai-floating-button";
import { NotificationsInboxProvider } from "@/components/providers/notifications-inbox-provider";

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
      <DashboardLayoutShell hideAiAssistant={hideAiAssistant}>
        {children}
      </DashboardLayoutShell>
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

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.role === "PROFESSOR") setProfessorRole(true);
      })
      .catch(() => {});
  }, []);

  const hideAi = hideAiAssistant;

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