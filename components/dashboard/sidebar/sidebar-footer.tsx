"use client";

import Link from "next/link";
import { Settings } from "lucide-react";

interface SidebarFooterProps {
  collapsed?: boolean;
}

export function SidebarFooter({ collapsed = false }: SidebarFooterProps) {
  return (
    <div className="border-t border-sidebar-border p-3">
      <Link
        href="/configuracoes"
        className={`flex items-center rounded-lg py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground ${
          collapsed ? "justify-center px-2" : "gap-3 px-3"
        }`}
        title={collapsed ? "Configurações" : undefined}
      >
        <Settings className="h-5 w-5" />
        {!collapsed ? "Configurações" : null}
      </Link>
    </div>
  );
}