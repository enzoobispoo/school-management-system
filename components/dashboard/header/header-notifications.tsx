"use client";

import { useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotificationsPolling } from "@/hooks/dashboard/use-notifications-polling";
import { cn } from "@/lib/utils";

function formatRelativeTime(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  if (hours < 24) return `há ${hours} hora${hours > 1 ? "s" : ""}`;
  return `há ${days} dia${days > 1 ? "s" : ""}`;
}

export function HeaderNotifications() {
  const {
    notifications,
    unreadCount,
    hasNew,
    loading,
    fetch: refetch,
    markAsRead,
    markAllAsRead,
    clearAll,
    clearHasNew,
  } = useNotificationsPolling();

  // limpa o flash quando o dropdown abre
  function handleOpenChange(open: boolean) {
    if (open) {
      clearHasNew();
      refetch();
    }
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell
            className={cn(
              "h-5 w-5 transition-colors",
              hasNew ? "text-foreground" : "text-muted-foreground"
            )}
          />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium text-background transition-all",
                hasNew ? "animate-bounce bg-red-500" : "bg-foreground"
              )}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-96" align="end">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notificações</DropdownMenuLabel>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={markAllAsRead}>
                Marcar lidas
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-destructive" onClick={clearAll}>
                Limpar
              </Button>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        {loading && notifications.length === 0 ? (
          <div className="px-2 py-4 text-sm text-muted-foreground">Carregando...</div>
        ) : notifications.length === 0 ? (
          <div className="px-2 py-4 text-sm text-muted-foreground">Nenhuma notificação.</div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex cursor-pointer flex-col items-start gap-1 p-3"
              onClick={() => markAsRead(n.id)}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{n.titulo}</span>
                {!n.lida && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-foreground" />}
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">{n.mensagem}</p>
              <span className="text-[11px] text-muted-foreground">{formatRelativeTime(n.createdAt)}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
