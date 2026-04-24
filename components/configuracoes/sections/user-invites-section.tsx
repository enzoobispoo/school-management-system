"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SettingsFeedback } from "@/components/configuracoes/shared/settings-feedback";
import { useUserInvites } from "@/hooks/configuracoes/use-user-invites";

type UserRole = "ADMIN" | "FINANCEIRO" | "SECRETARIA" | "PROFESSOR";

export function UserInvitesSection() {
  const {
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
  } = useUserInvites();

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Convites</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gere um link seguro para convidar novos usuários.
          </p>
        </div>

        <Link
          href="/configuracoes/usuarios"
          className="rounded-2xl border border-border px-4 py-2 text-sm text-foreground hover:bg-accent"
        >
          Voltar para usuários
        </Link>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">E-mail</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@empresa.com"
            className="h-11 rounded-2xl"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">Perfil</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="h-11 rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none"
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
            className="h-11 rounded-2xl border border-white/10 bg-white/10 px-5 text-white backdrop-blur-md hover:bg-white/20"
          >
            {loading ? "Criando..." : "Criar convite"}
          </Button>
        </div>

        {inviteLink ? (
          <div className="rounded-[24px] border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground">
              Link de convite gerado
            </p>
            <p className="mt-2 break-all text-sm text-muted-foreground">
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
        <SettingsFeedback error={error} success={success} />
      </div>
    </div>
  );
}