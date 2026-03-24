"use client";

import { GraduationCap } from "lucide-react";

interface SidebarLogoProps {
  collapsed?: boolean;
}

export function SidebarLogo({ collapsed = false }: SidebarLogoProps) {
  return (
    <div
      className={
        collapsed ? "flex justify-center" : "flex items-center gap-3 px-3"
      }
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black">
        <GraduationCap className="h-5 w-5 text-white" />
      </div>

      {!collapsed ? (
        <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
          EduGestão
        </span>
      ) : null}
    </div>
  );
}
