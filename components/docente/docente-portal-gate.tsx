"use client";

import { useEffect } from "react";

/**
 * Encerra a sessão do professor se a escola desligar o portal após o login
 * (bloqueio efetivo nas APIs + UX consistente).
 */
export function DocentePortalGate({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        if (cancelled || !res.ok) return;
        if (data.user?.role !== "PROFESSOR") return;
        if (data.professorPortalEnabled !== false) return;
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        if (!cancelled) {
          window.location.href = "/login?motivo=portal_docente";
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
}
