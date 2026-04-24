"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SettingsFeedback } from "@/components/configuracoes/shared/settings-feedback";
import { useAiSettings } from "@/hooks/configuracoes/use-ai-settings";

export function AiSettingsSection() {
  const { form, loading, saving, success, error, updateField, handleSave } =
    useAiSettings();

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">IA</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Defina como a EduIA será usada no sistema.
        </p>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground">Modo de IA</label>
        <select
          value={form.providerMode}
          onChange={(e) => updateField("providerMode", e.target.value)}
          className="h-11 rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none"
          disabled={loading}
        >
          <option value="PLATFORM">Usar IA da plataforma</option>
          <option value="CUSTOM">Usar chave própria do cliente</option>
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground">OpenAI API Key</label>
        <Input
          type="password"
          value={form.apiKey}
          onChange={(e) => updateField("apiKey", e.target.value)}
          placeholder="sk-..."
          className="h-11 rounded-2xl"
          disabled={loading}
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground">
          Limite mensal de uso
        </label>
        <Input
          type="number"
          value={form.monthlyLimit}
          onChange={(e) => updateField("monthlyLimit", e.target.value)}
          className="h-11 rounded-2xl"
          disabled={loading}
        />
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