"use client";

import { useEffect, useState } from "react";

type UserRole = "ADMIN" | "FINANCEIRO" | "SECRETARIA" | "PROFESSOR";

type SchoolOption = { id: string; nome: string; slug: string };

export function useUserInvites() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("SECRETARIA");
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [loadingSchools, setLoadingSchools] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/schools", { cache: "no-store" });
        if (!res.ok) {
          return;
        }
        const data = (await res.json()) as { schools?: SchoolOption[] };
        if (cancelled || !data.schools?.length) return;
        setSchools(data.schools);
        setSchoolId((prev) => (prev ? prev : data.schools![0].id));
      } finally {
        if (!cancelled) setLoadingSchools(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateInvite() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setInviteLink("");

      if (!schoolId) {
        setError("Selecione a escola do convite.");
        return;
      }

      const response = await fetch("/api/auth/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role,
          schoolId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Não foi possível criar o convite.");
      }

      setInviteLink(result.inviteLink);
      setSuccess("Convite criado com sucesso.");
      setEmail("");
      setRole("SECRETARIA");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível criar o convite."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setSuccess("Link copiado com sucesso.");
  }

  return {
    email,
    setEmail,
    role,
    setRole,
    inviteLink,
    loading,
    error,
    success,
    schools,
    schoolId,
    setSchoolId,
    loadingSchools,
    handleCreateInvite,
    handleCopy,
  };
}
