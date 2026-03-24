"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NotificationsResponse {
  data: Array<{
    id: string
    tipo: string
    titulo: string
    mensagem: string
    lida: boolean
    createdAt: string
  }>
  meta: {
    total: number
    unreadCount: number
    page: number
    pageSize: number
    totalPages: number
  }
}

function formatRelativeTime(dateString: string) {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()

  const minutes = Math.floor(diffMs / 1000 / 60)
  const hours = Math.floor(diffMs / 1000 / 60 / 60)
  const days = Math.floor(diffMs / 1000 / 60 / 60 / 24)

  if (minutes < 1) return "agora"
  if (minutes < 60) return `há ${minutes} min`
  if (hours < 24) return `há ${hours} hora${hours > 1 ? "s" : ""}`
  return `há ${days} dia${days > 1 ? "s" : ""}`
}

export function HeaderNotifications() {
  const [notifications, setNotifications] = useState<NotificationsResponse["data"]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  async function fetchNotifications() {
    try {
      setLoadingNotifications(true)

      const response = await fetch("/api/notificacoes?limit=8", {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("Erro ao buscar notificações")
      }

      const result: NotificationsResponse = await response.json()
      setNotifications(result.data)
      setUnreadCount(result.meta.unreadCount)
    } catch (error) {
      console.error("Erro ao carregar notificações:", error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  async function markAsRead(notificationId: string, alreadyRead: boolean) {
    if (alreadyRead) return

    try {
      const response = await fetch(`/api/notificacoes/${notificationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lida: true }),
      })

      if (!response.ok) {
        throw new Error("Erro ao marcar notificação como lida")
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, lida: true } : item
        )
      )
      setUnreadCount((prev) => Math.max(prev - 1, 0))
    } catch (error) {
      console.error(error)
    }
  }

  async function markAllAsRead() {
    try {
      const response = await fetch("/api/notificacoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marcarTodasComoLidas: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao marcar todas como lidas")
      }

      setNotifications((prev) => prev.map((item) => ({ ...item, lida: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  return (
    <DropdownMenu onOpenChange={(open) => open && fetchNotifications()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-96" align="end">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notificações</DropdownMenuLabel>
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={markAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          ) : null}
        </div>

        <DropdownMenuSeparator />

        {loadingNotifications ? (
          <div className="px-2 py-4 text-sm text-muted-foreground">
            Carregando notificações...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-2 py-4 text-sm text-muted-foreground">
            Nenhuma notificação encontrada.
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex cursor-pointer flex-col items-start gap-1 p-3"
              onClick={() => markAsRead(notification.id, notification.lida)}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {notification.titulo}
                </span>
                {!notification.lida ? (
                  <span className="mt-1 h-2 w-2 rounded-full bg-black" />
                ) : null}
              </div>

              <p className="line-clamp-2 text-xs text-muted-foreground">
                {notification.mensagem}
              </p>

              <span className="text-[11px] text-muted-foreground">
                {formatRelativeTime(notification.createdAt)}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}