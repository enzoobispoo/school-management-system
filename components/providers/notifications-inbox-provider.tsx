"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useNotificationsPolling } from "@/hooks/dashboard/use-notifications-polling";

type NotificationsInboxValue = ReturnType<typeof useNotificationsPolling>;

const NotificationsInboxContext =
  createContext<NotificationsInboxValue | null>(null);

export function NotificationsInboxProvider({ children }: { children: ReactNode }) {
  const value = useNotificationsPolling();
  return (
    <NotificationsInboxContext.Provider value={value}>
      {children}
    </NotificationsInboxContext.Provider>
  );
}

export function useNotificationsInbox(): NotificationsInboxValue {
  const ctx = useContext(NotificationsInboxContext);
  if (!ctx) {
    throw new Error(
      "useNotificationsInbox must be used within NotificationsInboxProvider"
    );
  }
  return ctx;
}
