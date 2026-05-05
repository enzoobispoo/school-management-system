"use client";

import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";

interface SidebarLogoProps {
  collapsed?: boolean;
}

interface SchoolData {
  nomeEscola: string;
  logoUrl?: string | null;
}

export function SidebarLogo({ collapsed = false }: SidebarLogoProps) {
  const [school, setSchool] = useState<SchoolData>({ nomeEscola: "EduGestão", logoUrl: null });

  useEffect(() => {
    fetch("/api/settings/escola", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.nomeEscola) setSchool({ nomeEscola: d.nomeEscola, logoUrl: d.logoUrl });
      })
      .catch(() => {});
  }, []);

  const initials = school.nomeEscola
    ?.split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={collapsed ? "flex justify-center" : "flex items-center gap-3"}>
      {/* Avatar da escola */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg shadow-sm"
        style={{ backgroundColor: "var(--brand-primary)" }}
      >
        {school.logoUrl ? (
          <img src={school.logoUrl} alt="Logo" className="h-full w-full object-cover" />
        ) : initials ? (
          <span className="text-[11px] font-bold text-white">{initials}</span>
        ) : (
          <GraduationCap className="h-4 w-4 text-white" />
        )}
      </div>

      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold leading-tight text-sidebar-foreground">
            {school.nomeEscola}
          </p>
          <p className="text-[10px] text-sidebar-foreground/40">Gestão escolar</p>
        </div>
      )}
    </div>
  );
}
