"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarFooter } from "@/components/dashboard/sidebar/sidebar-footer";
import { SidebarLogo } from "@/components/dashboard/sidebar/sidebar-logo";
import { SidebarMobileToggle } from "@/components/dashboard/sidebar/sidebar-mobile-toggle";
import { SidebarNavigation } from "@/components/dashboard/sidebar/sidebar-navigation";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <SidebarMobileToggle
        open={mobileMenuOpen}
        onToggle={() => setMobileMenuOpen((prev) => !prev)}
        onClose={() => setMobileMenuOpen(false)}
      />

      {mobileMenuOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar transition-all duration-300 ease-in-out lg:z-40 lg:translate-x-0",
          collapsed ? "w-[60px]" : "w-[220px]",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <SidebarLogo collapsed={collapsed} />

          <Button
            variant="ghost"
            size="icon"
            className="hidden h-7 w-7 shrink-0 text-sidebar-foreground/30 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground lg:inline-flex"
            onClick={onToggleCollapse}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-3.5 w-3.5" />
            ) : (
              <PanelLeftClose className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        <SidebarNavigation
          collapsed={collapsed}
          onNavigate={() => setMobileMenuOpen(false)}
        />

        <SidebarFooter collapsed={collapsed} />
      </aside>
    </>
  );
}