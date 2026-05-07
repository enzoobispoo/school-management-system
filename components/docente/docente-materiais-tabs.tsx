"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/docente/materiais", label: "Visão geral" },
  { href: "/docente/materiais/apresentacoes", label: "Apresentações" },
  { href: "/docente/materiais/provas", label: "Provas (arquivo)" },
  { href: "/docente/materiais/atividades", label: "Atividades (arquivo)" },
] as const;

export function DocenteMateriaisTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-border/60 pb-3"
      aria-label="Ambientes de materiais"
    >
      {LINKS.map(({ href, label }) => {
        const active =
          href === "/docente/materiais"
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
