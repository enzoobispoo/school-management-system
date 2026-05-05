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
  { href: "/configuracoes/notificacoes", label: "Notificações" },
];

const superAdminItems = [
  { href: "/configuracoes/financeiro", label: "Financeiro" },
  { href: "/configuracoes/usuarios", label: "Usuários" },
];

const adminItems = [
  { href: "/configuracoes/usuarios/convites", label: "Convites" },
  { href: "/configuracoes/ia", label: "IA e integrações" },
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
      ? [...baseItems, ...superAdminItems]
      : role === "ADMIN"
        ? [...baseItems, ...adminItems]
        : baseItems;

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href === "/configuracoes/usuarios" &&
            pathname.startsWith("/configuracoes/usuarios")) ||
          (item.href === "/configuracoes/usuarios/convites" &&
            pathname.startsWith("/configuracoes/usuarios/convites")) ||
          (item.href === "/configuracoes/ia" && pathname.startsWith("/configuracoes/ia"));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150",
              active
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}