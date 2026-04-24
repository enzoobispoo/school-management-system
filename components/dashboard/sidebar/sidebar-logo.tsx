"use client";

import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";

interface SidebarLogoProps {
  collapsed?: boolean;
}

interface SchoolData {
  nomeEscola: string;
  logoUrl?: string | null;
  corPrimaria?: string | null;
}

export function SidebarLogo({ collapsed = false }: SidebarLogoProps) {
  const [school, setSchool] = useState<SchoolData>({
    nomeEscola: "EduGestão",
    logoUrl: null,
    corPrimaria: "#111111",
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings/escola", {
          cache: "no-store",
        });

        const data = await res.json();

        if (res.ok) {
          setSchool({
            nomeEscola: data.nomeEscola || "EduGestão",
            logoUrl: data.logoUrl,
            corPrimaria: data.corPrimaria || "#111111",
          });
        }
      } catch {}
    }

    load();
  }, []);

  const initials = school.nomeEscola
    ?.split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={
        collapsed ? "flex justify-center" : "flex items-center gap-3 px-3"
      }
    >
      <div
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg"
        style={{ backgroundColor: "var(--brand-primary)" }}
      >
        {school.logoUrl ? (
          <img
            src={school.logoUrl}
            alt="Logo"
            className="h-full w-full object-cover"
          />
        ) : initials ? (
          <span className="text-sm font-semibold text-white">{initials}</span>
        ) : (
          <GraduationCap className="h-5 w-5 text-white" />
        )}
      </div>

      {!collapsed ? (
        <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
          {school.nomeEscola || "EduGestão"}
        </span>
      ) : null}
    </div>
  );
}