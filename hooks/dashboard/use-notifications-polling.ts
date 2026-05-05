"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  createdAt: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  hasNew: boolean;
  loading: boolean;
  fetch: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  clearHasNew: () => void;
}

const POLL_INTERVAL = 30_000;

export function useNotificationsPolling(): NotificationsState {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNew, setHasNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const prevUnreadRef = useRef<number | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notificacoes?limit=8", { cache: "no-store" });
      if (!res.ok) return;
      const result = await res.json();
      setNotifications(result.data);
      const newCount: number = result.meta.unreadCount;
      setUnreadCount(newCount);
      if (prevUnreadRef.current !== null && newCount > prevUnreadRef.current) {
        setHasNew(true);
      }
      prevUnreadRef.current = newCount;
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  async function markAsRead(id: string) {
    const notif = notifications.find((n) => n.id === id);
    if (!notif || notif.lida) return;
    await fetch(`/api/notificacoes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lida: true }),
    });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, lida: true } : n));
    setUnreadCount((prev) => Math.max(prev - 1, 0));
    if (prevUnreadRef.current !== null) prevUnreadRef.current = Math.max(prevUnreadRef.current - 1, 0);
  }

  async function markAllAsRead() {
    await fetch("/api/notificacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marcarTodasComoLidas: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
    setUnreadCount(0);
    prevUnreadRef.current = 0;
  }

  async function clearAll() {
    await Promise.all(notifications.map((n) => fetch(`/api/notificacoes/${n.id}`, { method: "DELETE" })));
    setNotifications([]);
    setUnreadCount(0);
    prevUnreadRef.current = 0;
  }

  return {
    notifications,
    unreadCount,
    hasNew,
    loading,
    fetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
    clearHasNew: () => setHasNew(false),
  };
}
