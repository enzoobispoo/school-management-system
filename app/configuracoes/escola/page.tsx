"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type UserRole = "ADMIN" | "FINANCEIRO" | "SECRETARIA" | "PROFESSOR";

export default function ConfiguracoesEscolaPage() {
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

  return (
    <DashboardLayout>
      <Header
        title="Convites"
        description="Gere um link seguro para o cliente ativar a conta."
      />

      <div className="p-6">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-black">E-mail</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@empresa.com"
                className="h-11 rounded-2xl"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-black">Perfil</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="h-11 rounded-2xl border border-black/10 bg-white px-3 text-sm text-black outline-none"
              >
                <option value="ADMIN">Administrador</option>
                <option value="FINANCEIRO">Financeiro</option>
                <option value="SECRETARIA">Secretaria</option>
                <option value="PROFESSOR">Professor</option>
              </select>
            </div>

            <div>
              <Button
                onClick={handleCreateInvite}
                disabled={loading}
                className="h-11 rounded-2xl bg-black px-5 text-white hover:bg-black/90"
              >
                {loading ? "Criando..." : "Criar convite"}
              </Button>
            </div>

            {inviteLink ? (
              <div className="rounded-[24px] border border-black/10 bg-black/[0.03] p-4">
                <p className="text-sm font-medium text-black">
                  Link de convite gerado
                </p>
                <p className="mt-2 break-all text-sm text-black/60">
                  {inviteLink}
                </p>

                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="mt-4 h-10 rounded-2xl"
                >
                  Copiar link
                </Button>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 text-sm text-black">
                {success}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}