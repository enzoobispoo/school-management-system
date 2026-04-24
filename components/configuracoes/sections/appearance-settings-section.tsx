"use client";

import { Button } from "@/components/ui/button";
import { SettingsFeedback } from "@/components/configuracoes/shared/settings-feedback";
import { useAppearanceSettings } from "@/hooks/configuracoes/use-appearance-settings";

export function AppearanceSettingsSection() {
  const { form, loading, saving, success, error, updateField, handleSave } =
    useAppearanceSettings();

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-lg font-semibold text-black dark:text-white">Tema</h2>
        <div className="mt-3 flex gap-3">
          {["light", "dark"].map((tema) => (
            <button
              key={tema}
              onClick={() => updateField("tema", tema)}
              className={`rounded-2xl border px-4 py-3 text-sm transition ${
                form.tema === tema
                  ? "border-black bg-black text-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:backdrop-blur-md"
                  : "border-black/10 bg-white text-black hover:bg-black/[0.03] dark:border-border dark:bg-muted/30 dark:text-foreground dark:hover:bg-accent"
              }`}
            >
              {tema === "light" ? "Claro" : "Escuro"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-black dark:text-white">Densidade</h2>
        <div className="mt-3 flex gap-3">
          {["comfortable", "compact"].map((densidade) => (
            <button
              key={densidade}
              onClick={() => updateField("densidade", densidade)}
              className={`rounded-2xl border px-4 py-3 text-sm transition ${
                form.densidade === densidade
                  ? "border-black bg-black text-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:backdrop-blur-md"
                  : "border-black/10 bg-white text-black hover:bg-black/[0.03] dark:border-border dark:bg-muted/30 dark:text-foreground dark:hover:bg-accent"
              }`}
            >
              {densidade === "comfortable" ? "Confortável" : "Compacto"}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving || loading}
        className="h-11 rounded-2xl bg-black text-white hover:bg-black/90 dark:border dark:border-white/10 dark:bg-white/10 dark:text-white dark:backdrop-blur-md dark:hover:bg-white/20"
      >
        {saving ? "Salvando..." : "Salvar"}
      </Button>
      <SettingsFeedback error={error} success={success} />
    </div>
  );
}