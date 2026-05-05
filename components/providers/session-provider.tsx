"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/login") return;

    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 401) {
        const url = typeof args[0] === "string" ? args[0] : args[0]?.toString() ?? "";
        // ignora rotas de auth para não criar loop
        if (!url.includes("/api/auth/")) {
          toast.error("Sessão expirada. Faça login novamente.");
          router.push("/login");
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [pathname, router]);

  return <>{children}</>;
}
