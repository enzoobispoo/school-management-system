"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SettingsFeedback } from "@/components/configuracoes/shared/settings-feedback";
import { useUsersSettings } from "@/hooks/configuracoes/use-users-settings";

const roleOptions = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Administrador" },
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "SECRETARIA", label: "Secretaria" },
  { value: "PROFESSOR", label: "Professor" },
] as const;

export function UsersSettingsSection() {
  const {
    users,
    loading,
    checkingAccess,
    hasAccess,
    savingId,
    success,
    error,
    updateUser,
  } = useUsersSettings();

  if (checkingAccess) {
    return <p className="text-sm text-muted-foreground">Verificando acesso...</p>;
  }

  if (!hasAccess) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
        Você não tem permissão para acessar esta área.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Usuários</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie perfis e acesso ao sistema.
          </p>
        </div>

        <Link
          href="/configuracoes/usuarios/convites"
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-md hover:bg-white/20"
        >
          Novo convite
        </Link>
      </div>

      {loading ? <p className="text-muted-foreground">Carregando...</p> : null}

      {!loading
        ? users.map((user) => (
            <div
              key={user.id}
              className="grid gap-4 rounded-[24px] border border-border bg-muted/20 p-4 md:grid-cols-[minmax(0,1fr)_180px_140px]"
            >
              <div>
                <p className="font-medium text-foreground">{user.nome}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>

              <select
                value={user.role}
                onChange={(e) =>
                  updateUser(user.id, {
                    role: e.target.value as typeof user.role,
                  })
                }
                disabled={savingId === user.id}
                className="h-11 rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none"
              >
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>

              <Button
                variant={user.ativo ? "outline" : "default"}
                onClick={() =>
                  updateUser(user.id, {
                    ativo: !user.ativo,
                  })
                }
                disabled={savingId === user.id}
                className="h-11 rounded-2xl"
              >
                {savingId === user.id
                  ? "Salvando..."
                  : user.ativo
                  ? "Desativar"
                  : "Ativar"}
              </Button>
            </div>
          ))
        : null}
      <SettingsFeedback error={error} success={success} />
    </div>
  );
}