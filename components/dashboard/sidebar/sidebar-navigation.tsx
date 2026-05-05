"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  Users,
  Wallet,
} from "lucide-react";

const groups = [
  {
    label: "Principal",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "Gestão",
    items: [
      { name: "Alunos", href: "/alunos", icon: Users },
      { name: "Cursos", href: "/cursos", icon: BookOpen },
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
}

export function SidebarNavigation({ collapsed = false, onNavigate }: SidebarNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-2">
      <div className={cn("flex flex-col", collapsed ? "gap-1" : "gap-5")}>
        {groups.map((group) => (
          <div key={group.label}>
            {/* Label do grupo — só aparece expandido */}
            {!collapsed && (
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/35">
                {group.label}
              </p>
            )}

            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(`${item.href}/`));

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.name : undefined}
                      className={cn(
                        "group flex items-center rounded-xl py-2.5 text-[12px] font-medium transition-all duration-150",
                        collapsed ? "justify-center px-3" : "gap-3 px-3",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-foreground shadow-sm"
                          : "text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      {/* Indicador ativo */}
                      {!collapsed && isActive && (
                        <span className="absolute left-0 h-5 w-[3px] rounded-r-full bg-sidebar-foreground opacity-60" />
                      )}

                      <item.icon
                        className={cn(
                          "shrink-0 transition-all duration-150",
                          collapsed ? "h-[18px] w-[18px]" : "h-[12px] w-[12px]",
                          isActive
                            ? "opacity-100"
                            : "opacity-50 group-hover:opacity-80"
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
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
