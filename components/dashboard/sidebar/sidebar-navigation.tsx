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
  PanelRight,
  MessageSquare,
  PenLine,
  Users,
  Wallet,
} from "lucide-react";

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
  if (href === "/financeiro") return routeBadges.financeiro;
  if (href === "/operacao") return routeBadges.operacao;
  if (href === "/turmas") return routeBadges.turmas;
  if (href === "/academico") return routeBadges.academico;
  if (href === "/notificacoes") return unreadNotificacoes > 0;
  return false;
}

const professorGroups = [
  {
    label: "Workspace",
    items: [
      { name: "Início", href: "/docente", icon: LayoutDashboard },
      { name: "EduIA", href: "/docente/eduia", icon: PanelRight },
      {
        name: "Turmas",
        href: "/docente#turmas-docente",
        icon: Layers,
      },
      { name: "Materiais", href: "/docente/materiais", icon: FileStack },
      {
        name: "Avaliações",
        href: "/docente/avaliacoes",
        icon: PenLine,
      },
      { name: "Mensagens", href: "/mensagens", icon: MessageSquare },
      { name: "Notificações", href: "/notificacoes", icon: Bell },
      {
        name: "Calendário",
        href: "/calendario/eventos",
        icon: CalendarDays,
      },
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

const groups = [
  {
    label: "Principal",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Operação", href: "/operacao", icon: Activity },
      { name: "Mensagens", href: "/mensagens", icon: MessageSquare },
      { name: "Notificações", href: "/notificacoes", icon: Bell },
    ],
  },
  {
    label: "Gestão",
    items: [
      { name: "Alunos", href: "/alunos", icon: Users },
      { name: "Turmas", href: "/turmas", icon: Layers },
      { name: "Cursos", href: "/cursos", icon: BookOpen },
      { name: "Acadêmico", href: "/academico", icon: ClipboardCheck },
      { name: "Professores", href: "/professores", icon: GraduationCap },
      { name: "Calendário", href: "/calendario/eventos", icon: CalendarDays },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { name: "Financeiro", href: "/financeiro", icon: Wallet },
      { name: "Relatórios", href: "/relatorios", icon: BarChart3 },
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

  const activeGroups = navRole === "PROFESSOR" ? professorGroups : groups;

  return (
    <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-2">
      <div className={cn("flex flex-col", collapsed ? "gap-1.5" : "gap-5")}>
        {activeGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="sticky top-0 z-10 mb-2 bg-sidebar/95 px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/35 backdrop-blur-sm supports-[backdrop-filter]:bg-sidebar/85">
                {group.label}
              </p>
            )}

            <ul className="flex flex-col gap-1">
              {group.items.map((item) => {
                const isActive =
                  navRole === "PROFESSOR" ?
                    professorNavItemIsActive(item, pathname, locHash)
                  : item.href === "/docente" ?
                    pathname === "/docente"
                  : pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(`${item.href}/`));

                const showUnread =
                  item.href === "/notificacoes" &&
                  unreadCount > 0;

                const showNovidadeDot = novidadeDotForHref(
                  item.href,
                  routeBadges,
                  unreadCount
                );

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
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
                      title={collapsed ? item.name : undefined}
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
                        <span className="truncate">{item.name}</span>
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
