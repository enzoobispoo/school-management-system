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
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out lg:z-40 lg:translate-x-0",
          collapsed ? "w-20" : "w-64",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border px-3 py-3">
          <SidebarLogo collapsed={collapsed} />

          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={onToggleCollapse}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
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