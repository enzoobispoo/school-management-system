"use client";

import { useState } from "react";

type UserRole = "ADMIN" | "FINANCEIRO" | "SECRETARIA" | "PROFESSOR";

export function useUserInvites() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("SECRETARIA");
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleCreateInvite() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setInviteLink("");

      const response = await fetch("/api/auth/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role,
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
    handleCreateInvite,
    handleCopy,
  };
}