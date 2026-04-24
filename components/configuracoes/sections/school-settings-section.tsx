"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SettingsFeedback } from "@/components/configuracoes/shared/settings-feedback";
import { useSchoolSettings } from "@/hooks/configuracoes/use-school-settings";

export function SchoolSettingsSection() {
  const { form, loading, saving, success, error, updateField, handleSave } =
    useSchoolSettings();

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Escola</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Defina os dados principais da sua instituição.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              Nome da escola
            </label>
            <Input
              value={form.nomeEscola}
              onChange={(e) => updateField("nomeEscola", e.target.value)}
              className="h-11 rounded-2xl"
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">CNPJ</label>
            <Input
              value={form.cnpj}
              onChange={(e) => updateField("cnpj", e.target.value)}
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

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">WhatsApp</label>
            <Input
              value={form.whatsapp}
              onChange={(e) => updateField("whatsapp", e.target.value)}
              className="h-11 rounded-2xl"
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              Cor principal
            </label>
            <div className="flex gap-2">
              <Input
                value={form.corPrimaria}
                onChange={(e) => updateField("corPrimaria", e.target.value)}
                className="h-11 rounded-2xl"
                disabled={loading}
              />
              <input
                type="color"
                value={form.corPrimaria}
                onChange={(e) => updateField("corPrimaria", e.target.value)}
                className="h-11 w-14 rounded-2xl border border-border bg-background p-1"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-medium text-foreground">Logo URL</label>
            <Input
              value={form.logoUrl}
              onChange={(e) => updateField("logoUrl", e.target.value)}
              placeholder="https://..."
              className="h-11 rounded-2xl"
              disabled={loading}
            />
          </div>

          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-medium text-foreground">Endereço</label>
            <Input
              value={form.endereco}
              onChange={(e) => updateField("endereco", e.target.value)}
              className="h-11 rounded-2xl"
              disabled={loading}
            />
          </div>
        </div>

        <div className="rounded-[24px] border border-border bg-muted/30 p-5">
          <p className="text-sm font-medium text-foreground">Prévia da identidade</p>

          <div className="mt-4 rounded-[20px] border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="Logo da escola"
                  className="h-12 w-12 rounded-2xl object-cover"
                />
              ) : (
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold text-white"
                  style={{ backgroundColor: form.corPrimaria || "#111111" }}
                >
                  {form.nomeEscola?.slice(0, 2).toUpperCase() || "EG"}
                </div>
              )}

              <div>
                <p className="font-semibold text-foreground">
                  {form.nomeEscola || "Nome da escola"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Identidade visual da plataforma
                </p>
              </div>
            </div>

            <div
              className="mt-5 rounded-2xl px-4 py-3 text-sm font-medium text-white"
              style={{ backgroundColor: form.corPrimaria || "#111111" }}
            >
              Cor principal aplicada
            </div>
          </div>
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