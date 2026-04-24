"use client";

import { useEffect, useState } from "react";

export type UserItem = {
  id: string;
  nome: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "FINANCEIRO" | "SECRETARIA" | "PROFESSOR";
  ativo: boolean;
};

type CurrentUserResponse = {
  user?: {
    id: string;
    nome: string;
    email: string;
    role: UserItem["role"];
  };
};

export function useUsersSettings() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function checkAccess() {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data: CurrentUserResponse = await res.json();

      if (res.ok && data.user?.role === "SUPER_ADMIN") {
        setHasAccess(true);
      } else {
        setHasAccess(false);
      }
    } catch {
      setHasAccess(false);
    } finally {
      setCheckingAccess(false);
    }
  }

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/users", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar usuários.");
      }

      setUsers(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar usuários."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (hasAccess) {
      loadUsers();
    }
  }, [hasAccess]);

  async function updateUser(
    id: string,
    payload: Partial<Pick<UserItem, "role" | "ativo">>
  ) {
    try {
      setSavingId(id);
      setError("");
      setSuccess("");

      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar usuário.");
      }

      setUsers((prev) =>
        prev.map((user) => (user.id === id ? { ...user, ...data } : user))
      );

      setSuccess("Usuário atualizado com sucesso.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao atualizar usuário."
      );
    } finally {
      setSavingId("");
    }
  }

  return {
    users,
    loading,
    checkingAccess,
    hasAccess,
    savingId,
    success,
    error,
    updateUser,
  };
}