"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarFooterProps {
  collapsed?: boolean;
}

export function SidebarFooter({ collapsed = false }: SidebarFooterProps) {
  const pathname = usePathname();
  const isActive = pathname.startsWith("/configuracoes");

  return (
    <div className="border-t border-sidebar-border p-3">
      <Link
        href="/configuracoes"
        className={cn(
          "flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
          collapsed ? "justify-center px-2" : "gap-3 px-3",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
        title={collapsed ? "Configurações" : undefined}
      >
        <Settings
          className={cn(
            "h-5 w-5 transition-colors",
            isActive ? "text-sidebar-primary" : "text-current"
          )}
        />
        {!collapsed ? "Configurações" : null}
      </Link>
    </div>
  );
}