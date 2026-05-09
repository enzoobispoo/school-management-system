"use client";

import { useCallback, useEffect, useState } from "react";

export type SidebarRouteBadges = {
  financeiro: boolean;
  operacao: boolean;
  turmas: boolean;
  academico: boolean;
};

/** Fallback quando o pai não injeta badges (ex.: forks sem polling). */
export const EMPTY_SIDEBAR_ROUTE_BADGES: SidebarRouteBadges = {
  financeiro: false,
  operacao: false,
  turmas: false,
  academico: false,
};

const POLL_MS = 45_000;

export function useSidebarBadges() {
  const [badges, setBadges] = useState<SidebarRouteBadges>(
    EMPTY_SIDEBAR_ROUTE_BADGES
  );

  const fetchBadges = useCallback(async () => {
    try {
      const res = await fetch("/api/navigation/sidebar-badges", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as Partial<SidebarRouteBadges>;
      setBadges({
        financeiro: !!data.financeiro,
        operacao: !!data.operacao,
        turmas: !!data.turmas,
        academico: !!data.academico,
      });
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    fetchBadges();
    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      void fetchBadges();
    }, POLL_MS);

    const onVis = () => {
      if (document.visibilityState === "visible") void fetchBadges();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [fetchBadges]);

  return { badges, refresh: fetchBadges };
}
