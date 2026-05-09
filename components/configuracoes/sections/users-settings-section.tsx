"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SettingsFeedback } from "@/components/configuracoes/shared/settings-feedback";
import { useUsersSettings } from "@/hooks/configuracoes/use-users-settings";

const roleOptions = [
  { value: "ADMIN", label: "Administrador" },
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "SECRETARIA", label: "Secretaria (acadêmica)" },
  {
    value: "SECRETARIA_FINANCEIRA",
    label: "Secretaria (com financeiro no painel)",
  },
  { value: "PROFESSOR", label: "Professor" },
] as const;

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrador",
  FINANCEIRO: "Financeiro",
  SECRETARIA: "Secretaria (acadêmica)",
  SECRETARIA_FINANCEIRA: "Secretaria (com financeiro no painel)",
  PROFESSOR: "Professor",
};

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
    systemSettings,
    savingSystem,
    systemSuccess,
    systemError,
    updateSystemField,
    saveSystemSettings,
  } = useUsersSettings();

  const [configOpenId, setConfigOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      const matchSearch =
        !q || u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchRole = filterRole === "ALL" || u.role === filterRole;
      const matchStatus =
        filterStatus === "ALL" ||
        (filterStatus === "ATIVO" ? u.ativo : !u.ativo);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, filterRole, filterStatus]);

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
      <div>
        <h2 className="text-lg font-semibold text-foreground">Usuários</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie perfis e acesso ao sistema.
        </p>
      </div>

      {/* Busca e filtros */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 min-w-[200px] flex-1 rounded-2xl"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="h-10 rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none"
        >
          <option value="ALL">Todos os perfis</option>
          {roleOptions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none"
        >
          <option value="ALL">Todos os status</option>
          <option value="ATIVO">Ativos</option>
          <option value="INATIVO">Inativos</option>
        </select>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
      )}

      {!loading &&
        filtered.map((user) => (
          <div key={user.id} className="relative">
            {/* Linha principal */}
            <div className="flex items-center gap-3 rounded-[20px] border border-border bg-muted/20 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{user.nome}</p>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              </div>

              <span className="hidden shrink-0 text-sm text-muted-foreground sm:block">
                {roleLabel[user.role] ?? user.role}
              </span>

              <span
                className={`hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium sm:block ${
                  user.ativo
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {user.ativo ? "Ativo" : "Inativo"}
              </span>

              {/* Três pontos */}
              <div className="relative shrink-0">
                <button
                  onClick={() =>
                    setConfigOpenId(configOpenId === user.id ? null : user.id)
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted"
                  title="Configurações"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="19" r="1.5" />
                  </svg>
                </button>

                {configOpenId === user.id && (
                  <>
                    {/* Overlay para fechar */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setConfigOpenId(null)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 top-10 z-20 w-72 rounded-[20px] border border-border bg-card p-4 shadow-lg">
                      <p className="mb-3 text-sm font-semibold text-foreground">
                        {user.nome}
                      </p>

                      {/* Role — não permite alterar SUPER_ADMIN */}
                      <div className="mb-2 grid gap-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Perfil
                        </label>
                        {user.role === "SUPER_ADMIN" ? (
                          <p className="text-sm text-muted-foreground px-3 py-2 rounded-xl border border-border bg-muted/30">
                            Super Admin — não editável
                          </p>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(e) =>
                              updateUser(user.id, {
                                role: e.target.value as typeof user.role,
                              })
                            }
                            disabled={savingId === user.id}
                            className="h-9 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"
                          >
                            {roleOptions.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Ativar/Desativar — não permite desativar SUPER_ADMIN */}
                      {user.role !== "SUPER_ADMIN" && (
                        <Button
                          variant={user.ativo ? "outline" : "default"}
                          onClick={() =>
                            updateUser(user.id, { ativo: !user.ativo })
                          }
                          disabled={savingId === user.id}
                          className="mb-4 h-9 w-full rounded-xl text-sm"
                        >
                          {savingId === user.id
                            ? "Salvando..."
                            : user.ativo
                            ? "Desativar usuário"
                            : "Ativar usuário"}
                        </Button>
                      )}

                      <div className="mb-3 border-t border-border pt-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Provedor de cobrança
                        </p>
                        <div className="grid gap-2">
                          <div className="grid gap-1">
                            <label className="text-xs text-muted-foreground">
                              Ambiente
                            </label>
                            <select
                              value={systemSettings.asaasEnvironment}
                              onChange={(e) =>
                                updateSystemField("asaasEnvironment", e.target.value)
                              }
                              className="h-9 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"
                            >
                              <option value="sandbox">Sandbox</option>
                              <option value="production">Produção</option>
                            </select>
                          </div>
                          <div className="grid gap-1">
                            <label className="text-xs text-muted-foreground">
                              API Key (Asaas)
                            </label>
                            <Input
                              value={systemSettings.asaasApiKey}
                              onChange={(e) =>
                                updateSystemField("asaasApiKey", e.target.value)
                              }
                              placeholder="$aact_..."
                              className="h-9 rounded-xl text-sm"
                            />
                          </div>
                          <div className="grid gap-1">
                            <label className="text-xs text-muted-foreground">
                              Wallet ID
                            </label>
                            <Input
                              value={systemSettings.asaasWalletId}
                              onChange={(e) =>
                                updateSystemField("asaasWalletId", e.target.value)
                              }
                              placeholder="Opcional"
                              className="h-9 rounded-xl text-sm"
                            />
                          </div>
                          <div className="grid gap-1">
                            <label className="text-xs text-muted-foreground">
                              Método padrão
                            </label>
                            <select
                              value={systemSettings.defaultChargeMethod}
                              onChange={(e) =>
                                updateSystemField("defaultChargeMethod", e.target.value)
                              }
                              className="h-9 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"
                            >
                              <option value="boleto">Boleto</option>
                              <option value="pix">Pix</option>
                              <option value="cartao">Cartão</option>
                            </select>
                          </div>
                          <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                            <input
                              type="checkbox"
                              checked={systemSettings.billingEnabled}
                              onChange={(e) =>
                                updateSystemField("billingEnabled", e.target.checked)
                              }
                            />
                            <span className="text-xs text-foreground">
                              Ativar integração
                            </span>
                          </label>
                          <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                            <input
                              type="checkbox"
                              checked={systemSettings.autoGenerateBoleto}
                              onChange={(e) =>
                                updateSystemField("autoGenerateBoleto", e.target.checked)
                              }
                            />
                            <span className="text-xs text-foreground">
                              Gerar boleto automaticamente
                            </span>
                          </label>
                          <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                            <input
                              type="checkbox"
                              checked={systemSettings.autoSendBoletoWhatsApp}
                              onChange={(e) =>
                                updateSystemField(
                                  "autoSendBoletoWhatsApp",
                                  e.target.checked
                                )
                              }
                            />
                            <span className="text-xs text-foreground">
                              Enviar boleto no WhatsApp
                            </span>
                          </label>
                        </div>
                      </div>

                      <div className="mb-3 border-t border-border pt-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          IA
                        </p>
                        <div className="grid gap-2">
                          <div className="grid gap-1">
                            <label className="text-xs text-muted-foreground">
                              Modo
                            </label>
                            <select
                              value={systemSettings.aiProviderMode}
                              onChange={(e) =>
                                updateSystemField("aiProviderMode", e.target.value)
                              }
                              className="h-9 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"
                            >
                              <option value="PLATFORM">Plataforma</option>
                              <option value="CUSTOM">Chave própria</option>
                            </select>
                          </div>
                          <div className="grid gap-1">
                            <label className="text-xs text-muted-foreground">
                              Limite mensal
                            </label>
                            <Input
                              type="number"
                              value={systemSettings.aiMonthlyLimit}
                              onChange={(e) =>
                                updateSystemField("aiMonthlyLimit", e.target.value)
                              }
                              className="h-9 rounded-xl text-sm"
                            />
                          </div>
                          <div className="grid gap-1">
                            <label className="text-xs text-muted-foreground">
                              OpenAI API Key
                            </label>
                            <Input
                              type="password"
                              value={systemSettings.openaiApiKey}
                              onChange={(e) =>
                                updateSystemField("openaiApiKey", e.target.value)
                              }
                              placeholder="sk-..."
                              className="h-9 rounded-xl text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => saveSystemSettings().then(() => setConfigOpenId(null))}
                        disabled={savingSystem}
                        className="h-9 w-full rounded-xl bg-black text-sm text-white hover:bg-black/90 dark:border dark:border-white/10 dark:bg-white/10 dark:backdrop-blur-md dark:hover:bg-white/20"
                      >
                        {savingSystem ? "Salvando..." : "Salvar configurações"}
                      </Button>

                      <SettingsFeedback error={systemError} success={systemSuccess} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

      <SettingsFeedback error={error} success={success} />
    </div>
  );
}
