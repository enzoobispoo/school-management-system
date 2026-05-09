"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

interface SidebarFooterProps {
  collapsed?: boolean;
}

export function SidebarFooter({ collapsed = false }: SidebarFooterProps) {
  const { t } = useDashboardLanguage();
  const pathname = usePathname();
  const isActive = pathname.startsWith("/configuracoes");
  const label = t("nav.settings");

  return (
    <div className="px-3 pb-4 pt-2">
      <div className="mb-3 h-px bg-sidebar-border/60" />

      <Link
        href="/configuracoes"
        title={collapsed ? label : undefined}
        className={cn(
          "group relative flex items-center rounded-xl py-2.5 text-[13px] font-medium transition-all duration-150",
          collapsed ? "justify-center px-2" : "gap-3 px-3",
          isActive
            ? "bg-sidebar-accent text-sidebar-foreground shadow-sm ring-1 ring-sidebar-border/60"
            : "text-sidebar-foreground/55 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
        )}
      >
        <Settings
          className={cn(
            "h-[12px] w-[12px] shrink-0 transition-all duration-150",
            isActive ? "opacity-100" : "opacity-50 group-hover:opacity-80"
          )}
        />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    </div>
  );
}
