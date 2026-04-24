"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SettingsFeedback } from "@/components/configuracoes/shared/settings-feedback";
import { useAccountSettings } from "@/hooks/configuracoes/use-account-settings";

export function AccountSettingsSection() {
  const { form, loading, saving, success, error, updateField, handleSave } =
    useAccountSettings();

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Conta</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Atualize seus dados de acesso e perfil.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">Nome</label>
          <Input
            value={form.nome}
            onChange={(e) => updateField("nome", e.target.value)}
            className="h-11 rounded-2xl"
            disabled={loading}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">E-mail</label>
          <Input
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="h-11 rounded-2xl"
            disabled={loading}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">Telefone</label>
          <Input
            value={form.telefone}
            onChange={(e) => updateField("telefone", e.target.value)}
            className="h-11 rounded-2xl"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="h-11 rounded-2xl border border-white/10 bg-white/10 px-5 text-white backdrop-blur-md hover:bg-white/20"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>

      <SettingsFeedback error={error} success={success} />
    </div>
  );
}