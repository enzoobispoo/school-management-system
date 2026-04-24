"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { AiFloatingButton } from "@/components/dashboard/ai/ai-floating-button";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />

      <main
        className={`transition-[padding] duration-300 ${
          collapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        {children}
      </main>

      <AiFloatingButton />
    </div>
  );
}