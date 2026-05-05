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
    <div className="px-3 pb-4 pt-2">
      {/* Divisor */}
      <div className="mb-3 h-px bg-sidebar-border/50" />

      <Link
        href="/configuracoes"
        title={collapsed ? "Configurações" : undefined}
        className={cn(
          "group flex items-center rounded-xl py-2 text-[13px] font-medium transition-all duration-150",
          collapsed ? "justify-center px-2" : "gap-3 px-3",
          isActive
            ? "bg-sidebar-accent text-sidebar-foreground shadow-sm"
            : "text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        <Settings
          className={cn(
            "h-[12px] w-[12px] shrink-0 transition-all duration-150",
            isActive ? "opacity-100" : "opacity-50 group-hover:opacity-80"
          )}
        />
        {!collapsed && <span className="truncate">Configurações</span>}
      </Link>
    </div>
  );
}
