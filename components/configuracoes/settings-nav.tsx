"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type CurrentUserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "FINANCEIRO"
  | "SECRETARIA"
  | "PROFESSOR";

const baseItems = [
  { href: "/configuracoes/conta", label: "Conta" },
  { href: "/configuracoes/dashboard", label: "Dashboard" },
  { href: "/configuracoes/escola", label: "Escola" },
  { href: "/configuracoes/financeiro", label: "Financeiro" },
  { href: "/configuracoes/notificacoes", label: "Notificações" },
  { href: "/configuracoes/ia", label: "IA" },
  { href: "/configuracoes/aparencia", label: "Aparência" },
];

export function SettingsNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<CurrentUserRole | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();

        if (res.ok) {
          setRole(data.user?.role ?? null);
        }
      } catch {
        setRole(null);
      }
    }

    loadUser();
  }, []);

  const items =
    role === "SUPER_ADMIN"
      ? [...baseItems, { href: "/configuracoes/usuarios", label: "Usuários" }]
      : baseItems;

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href === "/configuracoes/usuarios" &&
            pathname.startsWith("/configuracoes/usuarios"));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
              active
                ? "bg-black text-white dark:bg-white/10 dark:text-white dark:backdrop-blur-md dark:border dark:border-white/10"
                : "bg-black/[0.03] text-black/55 hover:bg-black/[0.05] dark:bg-muted/40 dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}