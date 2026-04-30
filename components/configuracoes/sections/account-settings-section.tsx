"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SettingsFeedback } from "@/components/configuracoes/shared/settings-feedback";
import { useAccountSettings } from "@/hooks/configuracoes/use-account-settings";

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function AccountSettingsSection() {
  const { form, loading, saving, success, error, updateField, handleSave } =
    useAccountSettings();

  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSavePassword() {
    setPasswordError("");
    setPasswordSuccess("");

    if (novaSenha !== confirmarSenha) {
      setPasswordError("As senhas não coincidem.");
      return;
    }
    if (novaSenha.length < 6) {
      setPasswordError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setSavingPassword(true);
      const response = await fetch("/api/settings/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao alterar senha.");
      setPasswordSuccess("Senha alterada com sucesso.");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setShowPasswordFields(false);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Erro ao alterar senha.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="grid gap-6">
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
            onChange={(e) => updateField("telefone", maskPhone(e.target.value))}
            placeholder="(00) 00000-0000"
            className="h-11 rounded-2xl"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="h-11 rounded-2xl bg-black px-5 text-white hover:bg-black/90 dark:border dark:border-white/10 dark:bg-white/10 dark:backdrop-blur-md dark:hover:bg-white/20"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>

      <SettingsFeedback error={error} success={success} />

      <div className="rounded-[24px] border border-border bg-muted/30 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Senha</p>
            <p className="text-xs text-muted-foreground">Altere sua senha de acesso.</p>
          </div>
          <button
            onClick={() => {
              setShowPasswordFields((v) => !v);
              setPasswordError("");
              setPasswordSuccess("");
            }}
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            {showPasswordFields ? "Cancelar" : "Alterar senha"}
          </button>
        </div>

        {showPasswordFields && (
          <div className="mt-4 grid gap-3">
            <Input
              type="password"
              placeholder="Senha atual"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              className="h-11 rounded-2xl"
            />
            <Input
              type="password"
              placeholder="Nova senha"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="h-11 rounded-2xl"
            />
            <Input
              type="password"
              placeholder="Confirmar nova senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="h-11 rounded-2xl"
            />
            <Button
              onClick={handleSavePassword}
              disabled={savingPassword}
              className="h-11 rounded-2xl bg-black px-5 text-white hover:bg-black/90 dark:border dark:border-white/10 dark:bg-white/10 dark:backdrop-blur-md dark:hover:bg-white/20"
            >
              {savingPassword ? "Salvando..." : "Confirmar nova senha"}
            </Button>
            <SettingsFeedback error={passwordError} success={passwordSuccess} />
          </div>
        )}
      </div>
    </div>
  );
}
