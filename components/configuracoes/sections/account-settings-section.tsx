"use client";

import { useState } from "react";
import { Camera, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SettingsFeedback } from "@/components/configuracoes/shared/settings-feedback";
import { useAccountSettings } from "@/hooks/configuracoes/use-account-settings";
import { cn } from "@/lib/utils";

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

function initialsFromNome(nome: string) {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export function AccountSettingsSection() {
  const {
    form,
    loading,
    saving,
    success,
    error,
    updateField,
    handleSave,
    avatarPreviewSrc,
    pickAvatarFile,
    markRemoveAvatar,
  } = useAccountSettings();

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
        <h2 className="text-lg font-semibold text-foreground">Conta e perfil</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nome, foto, telefone e e-mail são usados nas mensagens internas e cabeçalhos da escola.
        </p>
      </div>

      <div className="rounded-[24px] border border-border bg-muted/25 p-5 dark:bg-muted/15">
        <p className="text-sm font-medium text-foreground">Foto do perfil</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Envie uma imagem (até 4MB) ou cole uma URL https pública. JPG, PNG, WebP ou GIF.
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar className={cn("size-24 shrink-0 ring-2 ring-border/70")}>
            {avatarPreviewSrc ? (
              <AvatarImage src={avatarPreviewSrc} alt="" className="object-cover" />
            ) : null}
            <AvatarFallback className="text-lg font-semibold">
              {form.nome.trim() ?
                initialsFromNome(form.nome)
              : <UserRound className="h-10 w-10 opacity-40" aria-hidden />}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="grid gap-2">
              <Label htmlFor="avatar-url">URL da foto (opcional)</Label>
              <Input
                id="avatar-url"
                value={form.avatarUrl}
                onChange={(e) => {
                  pickAvatarFile(null);
                  updateField("avatarUrl", e.target.value);
                }}
                placeholder="https://…"
                className="h-11 rounded-2xl font-mono text-[13px]"
                disabled={loading}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl gap-2"
                disabled={loading}
                onClick={() =>
                  document.getElementById("avatar-file-input")?.click()
                }
              >
                <Camera className="h-4 w-4" />
                Escolher arquivo
              </Button>
              <input
                id="avatar-file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  pickAvatarFile(f ?? null);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-xl text-muted-foreground"
                disabled={loading}
                onClick={() => markRemoveAvatar()}
              >
                Remover foto
              </Button>
            </div>
          </div>
        </div>
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
          className="h-8 rounded-md px-4"
        >
          {saving ? "Salvando..." : "Salvar perfil"}
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
              className="h-8 rounded-md px-4"
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
