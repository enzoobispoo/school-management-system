"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { EduiaClientCaps } from "@/lib/ai/eduia-client-caps";

export type DashboardSessionUser = {
  id?: string;
  nome?: string;
  role?: string;
};

type DashboardSessionState = {
  loading: boolean;
  user: DashboardSessionUser | null;
  eduiaCaps: EduiaClientCaps | null;
  refresh: () => Promise<void>;
};

const DashboardSessionContext = createContext<DashboardSessionState | null>(
  null
);

export function DashboardSessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<DashboardSessionUser | null>(null);
  const [eduiaCaps, setEduiaCaps] = useState<EduiaClientCaps | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await res.json()) as {
        user?: DashboardSessionUser;
        eduiaCaps?: EduiaClientCaps | null;
      };
      if (res.ok && data.user) {
        setUser(data.user);
        setEduiaCaps(data.eduiaCaps ?? null);
      } else {
        setUser(null);
        setEduiaCaps(null);
      }
    } catch {
      setUser(null);
      setEduiaCaps(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      loading,
      user,
      eduiaCaps,
      refresh,
    }),
    [loading, user, eduiaCaps, refresh]
  );

  return (
    <DashboardSessionContext.Provider value={value}>
      {children}
    </DashboardSessionContext.Provider>
  );
}

export function useDashboardSession(): DashboardSessionState {
  const ctx = useContext(DashboardSessionContext);
  if (!ctx) {
    throw new Error("useDashboardSession requires DashboardSessionProvider");
  }
  return ctx;
}

/** Para componentes que podem renderizar fora do provider (fallback noop). */
export function useDashboardSessionOptional(): DashboardSessionState | null {
  return useContext(DashboardSessionContext);
}
