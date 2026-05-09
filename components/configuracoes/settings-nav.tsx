"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

type CurrentUserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "FINANCEIRO"
  | "SECRETARIA"
  | "SECRETARIA_FINANCEIRA"
  | "PROFESSOR";

const baseItems = [
  { href: "/configuracoes/conta", labelKey: "settings.nav.account" },
  { href: "/configuracoes/dashboard", labelKey: "settings.nav.dashboardPrefs" },
  { href: "/configuracoes/escola", labelKey: "settings.nav.school" },
  { href: "/configuracoes/notificacoes", labelKey: "settings.nav.notifications" },
];

const financeiroItems = [
  { href: "/configuracoes/conta", labelKey: "settings.nav.account" },
  { href: "/configuracoes/aparencia", labelKey: "settings.nav.appearance" },
  { href: "/configuracoes/notificacoes", labelKey: "settings.nav.notifications" },
];

const superAdminItems = [
  { href: "/configuracoes/financeiro", labelKey: "settings.nav.financial" },
  { href: "/configuracoes/usuarios", labelKey: "settings.nav.users" },
];

const adminItems = [
  { href: "/configuracoes/ia", labelKey: "settings.nav.aiIntegrations" },
  { href: "/configuracoes/usuarios/convites", labelKey: "settings.nav.teamInvites" },
];

export function SettingsNav() {
  const { t } = useDashboardLanguage();
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
        : role === "FINANCEIRO"
          ? financeiroItems
          : baseItems;

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href === "/configuracoes/usuarios" &&
            pathname.startsWith("/configuracoes/usuarios")) ||
          (item.href === "/configuracoes/ia" && pathname.startsWith("/configuracoes/ia")) ||
          (item.href === "/configuracoes/usuarios/convites" &&
            pathname.startsWith("/configuracoes/usuarios/convites"));

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
            {t(item.labelKey)}
          </Link>
        );
      })}
    </div>
  );
}
