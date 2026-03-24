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

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Alunos", href: "/alunos", icon: Users },
  { name: "Cursos", href: "/cursos", icon: BookOpen },
  { name: "Professores", href: "/professores", icon: GraduationCap },
  { name: "Calendário", href: "/calendario/eventos", icon: CalendarDays },
  { name: "Financeiro", href: "/financeiro", icon: Wallet },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3 },
];

interface SidebarNavigationProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNavigation({
  collapsed = false,
  onNavigate,
}: SidebarNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4">
      <ul className="flex flex-col gap-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.name}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
                  collapsed ? "justify-center px-2" : "gap-3 px-3",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-sidebar-primary")} />
                {!collapsed ? item.name : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}