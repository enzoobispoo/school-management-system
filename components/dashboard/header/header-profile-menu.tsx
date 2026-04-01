"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MeResponse {
  user?: {
    id: string;
    nome: string;
    email: string;
    role: "SUPER_ADMIN" | "ADMIN" | "FINANCEIRO" | "SECRETARIA" | "PROFESSOR";
    ativo: boolean;
  };
  error?: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatRole(role?: string) {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "ADMIN":
      return "Administrador";
    case "FINANCEIRO":
      return "Financeiro";
    case "SECRETARIA":
      return "Secretaria";
    case "PROFESSOR":
      return "Professor";
    default:
      return "Usuário";
  }
}

export function HeaderProfileMenu() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<MeResponse["user"]>(undefined);

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        setLoading(true);

        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const result: MeResponse = await response.json();

        if (!response.ok || !result.user) {
          setUser(undefined);
          return;
        }

        setUser(result.user);
      } catch {
        setUser(undefined);
      } finally {
        setLoading(false);
      }
    }

    loadCurrentUser();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  const fallback = useMemo(() => {
    if (!user?.nome) return "US";
    return getInitials(user.nome);
  }, [user]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src="/avatars/admin.jpg" alt={user?.nome || "Usuário"} />
            <AvatarFallback className="bg-black text-sm font-medium text-white">
              {fallback}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-60" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-none">
              {loading ? "Carregando..." : user?.nome || "Usuário"}
            </p>

            <p className="pt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              {formatRole(user?.role)}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            router.push("/");
          }}
        >
          Perfil
        </DropdownMenuItem>

        {user?.role === "SUPER_ADMIN" ? (
          <DropdownMenuItem
            onClick={() => {
              router.push("/configuracoes/escola");
            }}
          >
            Configurações
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-destructive"
          onClick={handleLogout}
        >
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}