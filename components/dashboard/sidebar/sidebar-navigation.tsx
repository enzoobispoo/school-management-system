"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Users,
  Wallet,
} from "lucide-react";

const groups = [
  {
    label: "Principal",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Operação", href: "/operacao", icon: Activity },
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
}

export function SidebarNavigation({
  collapsed = false,
  onNavigate,
  unreadCount = 0,
}: SidebarNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-2">
      <div className={cn("flex flex-col", collapsed ? "gap-1.5" : "gap-5")}>
        {groups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/35">
                {group.label}
              </p>
            )}

            <ul className="flex flex-col gap-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(`${item.href}/`));

                const showUnread =
                  item.href === "/notificacoes" &&
                  unreadCount > 0;

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
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

                      <item.icon
                        className={cn(
                          "shrink-0 transition-all duration-150",
                          collapsed ? "h-[17px] w-[17px]" : "h-[14px] w-[14px]",
                          isActive
                            ? "opacity-100"
                            : "opacity-55 group-hover:opacity-90"
                        )}
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
