"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EMPTY_SIDEBAR_ROUTE_BADGES,
  type SidebarRouteBadges,
} from "@/hooks/dashboard/use-sidebar-badges";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileStack,
  GraduationCap,
  Layers,
  LayoutDashboard,
  MessageSquare,
  PanelRight,
  PenLine,
  Shuffle,
  Users,
  Wallet,
} from "lucide-react";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

type SidebarNavItem = {
  titleKey: string;
  href: string;
  icon: LucideIcon;
};

type SidebarNavGroup = {
  groupKey: string;
  items: SidebarNavItem[];
};

function SidebarNavIcon({
  icon: Icon,
  dot,
  collapsed,
  isActive,
}: {
  icon: LucideIcon;
  dot: boolean;
  collapsed: boolean;
  isActive: boolean;
}) {
  return (
    <span className="relative inline-flex shrink-0">
      <Icon
        className={cn(
          "shrink-0 transition-all duration-150",
          collapsed ? "h-[17px] w-[17px]" : "h-[14px] w-[14px]",
          isActive
            ? "opacity-100"
            : "opacity-55 group-hover:opacity-90"
        )}
      />
      {dot ? (
        <span
          className={cn(
            "pointer-events-none absolute rounded-full bg-sidebar-primary shadow-[0_0_0_2px_var(--sidebar)]",
            collapsed ? "right-[-2px] top-[-2px] h-[7px] w-[7px]" : "right-[-3px] top-[-3px] h-[7px] w-[7px]"
          )}
          aria-hidden
        />
      ) : null}
    </span>
  );
}

function novidadeDotForHref(
  href: string,
  routeBadges: SidebarRouteBadges,
  unreadNotificacoes: number
): boolean {
  if (href === "/financeiro" || href.startsWith("/financeiro/")) {
    return routeBadges.financeiro;
  }
  if (href === "/operacao") return routeBadges.operacao;
  if (href === "/turmas") return routeBadges.turmas;
  if (href === "/academico") return routeBadges.academico;
  if (href === "/notificacoes") return unreadNotificacoes > 0;
  return false;
}

const professorGroups: SidebarNavGroup[] = [
  {
    groupKey: "sidebar.group.main",
    items: [
      { titleKey: "nav.home", href: "/docente", icon: LayoutDashboard },
      { titleKey: "nav.ai", href: "/docente/eduia", icon: PanelRight },
      { titleKey: "nav.messages", href: "/mensagens", icon: MessageSquare },
      { titleKey: "nav.notifications", href: "/notificacoes", icon: Bell },
    ],
  },
  {
    groupKey: "sidebar.group.pedagogical",
    items: [
      {
        titleKey: "nav.classes",
        href: "/docente#turmas-docente",
        icon: Layers,
      },
      { titleKey: "nav.materials", href: "/docente/materiais", icon: FileStack },
      {
        titleKey: "nav.assessments",
        href: "/docente/avaliacoes",
        icon: PenLine,
      },
      {
        titleKey: "nav.calendar",
        href: "/calendario/eventos",
        icon: CalendarDays,
      },
      { titleKey: "nav.swaps", href: "/docente/trocas", icon: Shuffle },
    ],
  },
];

function professorNavItemIsActive(
  item: { href: string },
  pathname: string,
  hash: string
) {
  if (item.href === "/docente") {
    return pathname === "/docente" && hash !== "#turmas-docente";
  }
  if (item.href.includes("#turmas-docente")) {
    return pathname === "/docente" && hash === "#turmas-docente";
  }
  const base = item.href.split("#")[0] ?? item.href;
  if (base === "/") return pathname === "/";
  return pathname === base || pathname.startsWith(`${base}/`);
}

const financeiroGroups: SidebarNavGroup[] = [
  {
    groupKey: "sidebar.group.main",
    items: [
      { titleKey: "nav.home", href: "/financeiro", icon: LayoutDashboard },
      { titleKey: "nav.charges", href: "/financeiro/cobrancas", icon: Wallet },
      { titleKey: "nav.ai", href: "/financeiro/eduia", icon: PanelRight },
      { titleKey: "nav.messages", href: "/mensagens", icon: MessageSquare },
      { titleKey: "nav.notifications", href: "/notificacoes", icon: Bell },
    ],
  },
  {
    groupKey: "sidebar.group.analytics",
    items: [{ titleKey: "nav.reports", href: "/relatorios", icon: BarChart3 }],
  },
];

const defaultGroups: SidebarNavGroup[] = [
  {
    groupKey: "sidebar.group.main",
    items: [
      { titleKey: "nav.dashboard", href: "/", icon: LayoutDashboard },
      { titleKey: "nav.ai", href: "/eduia", icon: PanelRight },
      { titleKey: "nav.operation", href: "/operacao", icon: Activity },
      { titleKey: "nav.messages", href: "/mensagens", icon: MessageSquare },
      { titleKey: "nav.notifications", href: "/notificacoes", icon: Bell },
    ],
  },
  {
    groupKey: "sidebar.group.management",
    items: [
      { titleKey: "nav.students", href: "/alunos", icon: Users },
      { titleKey: "nav.classes", href: "/turmas", icon: Layers },
      { titleKey: "nav.courses", href: "/cursos", icon: BookOpen },
      { titleKey: "nav.academic", href: "/academico", icon: ClipboardCheck },
      { titleKey: "nav.teachers", href: "/professores", icon: GraduationCap },
      { titleKey: "nav.calendar", href: "/calendario/eventos", icon: CalendarDays },
    ],
  },
  {
    groupKey: "sidebar.group.finance",
    items: [
      { titleKey: "nav.finance", href: "/financeiro", icon: Wallet },
      { titleKey: "nav.reports", href: "/relatorios", icon: BarChart3 },
    ],
  },
];

interface SidebarNavigationProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  unreadCount?: number;
  routeBadges?: SidebarRouteBadges;
}

export function SidebarNavigation({
  collapsed = false,
  onNavigate,
  unreadCount = 0,
  routeBadges = EMPTY_SIDEBAR_ROUTE_BADGES,
}: SidebarNavigationProps) {
  const { t } = useDashboardLanguage();
  const pathname = usePathname();
  const [navRole, setNavRole] = useState<string | null>(null);
  const [locHash, setLocHash] = useState("");

  useEffect(() => {
    setLocHash(
      typeof window !== "undefined" ? window.location.hash : ""
    );
    const onHash = () => setLocHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setNavRole(typeof d.user?.role === "string" ? d.user.role : null);
      })
      .catch(() => setNavRole(null));
  }, []);

  const secretaryDashboardHome =
    navRole === "SECRETARIA" || navRole === "SECRETARIA_FINANCEIRA";

  const activeGroups =
    navRole === "PROFESSOR" ? professorGroups
    : navRole === "FINANCEIRO" ? financeiroGroups
    : defaultGroups;

  return (
    <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-2">
      <div className={cn("flex flex-col", collapsed ? "gap-1.5" : "gap-5")}>
        {activeGroups.map((group) => (
          <div key={group.groupKey}>
            {!collapsed && (
              <p className="sticky top-0 z-10 mb-2 bg-sidebar/95 px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/35 backdrop-blur-sm supports-[backdrop-filter]:bg-sidebar/85">
                {t(group.groupKey)}
              </p>
            )}

            <ul className="flex flex-col gap-1">
              {group.items.map((item) => {
                const label = t(item.titleKey);
                const resolvedHref =
                  item.href === "/" && secretaryDashboardHome ?
                    "/secretaria"
                  : item.href;

                const isActive =
                  navRole === "PROFESSOR" ?
                    professorNavItemIsActive(item, pathname, locHash)
                  : item.href === "/docente" ?
                    pathname === "/docente"
                  : item.href === "/financeiro" ?
                    pathname === "/financeiro"
                  : pathname === resolvedHref ||
                    (resolvedHref !== "/" &&
                      pathname.startsWith(`${resolvedHref}/`));

                const showUnread =
                  item.href === "/notificacoes" &&
                  unreadCount > 0;

                const showNovidadeDot = novidadeDotForHref(
                  resolvedHref,
                  routeBadges,
                  unreadCount
                );

                return (
                  <li key={`${item.href}-${item.titleKey}`}>
                    <Link
                      href={resolvedHref}
                      scroll={
                        item.href.includes("#turmas-docente") ? false : undefined
                      }
                      onClick={(e) => {
                        if (
                          item.href.includes("#turmas-docente") &&
                          pathname === "/docente"
                        ) {
                          e.preventDefault();
                          window.location.hash = "turmas-docente";
                        }
                        onNavigate?.();
                      }}
                      title={collapsed ? label : undefined}
                      className={cn(
                        "group relative flex items-center rounded-xl py-2.5 text-[13px] font-medium transition-all duration-150",
                        collapsed ? "justify-center px-2.5" : "gap-3 px-3",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-foreground shadow-sm ring-1 ring-sidebar-border/60"
                          : "text-sidebar-foreground/55 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                      )}
                    >
                      {!collapsed && isActive && (
                        <span className="absolute left-0 h-5 w-[3px] rounded-r-full bg-sidebar-foreground/70" />
                      )}

                      <SidebarNavIcon
                        icon={item.icon}
                        collapsed={collapsed}
                        isActive={isActive}
                        dot={!!showNovidadeDot}
                      />
                      {!collapsed && (
                        <span className="truncate">{label}</span>
                      )}
                      {showUnread ? (
                        <span
                          className={cn(
                            "flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground shadow-sm",
                            collapsed &&
                              "pointer-events-none absolute -right-0.5 -top-0.5",
                            !collapsed && "ml-auto shrink-0"
                          )}
                          aria-hidden
                        >
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
