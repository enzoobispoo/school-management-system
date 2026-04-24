"use client";

import { Button } from "@/components/ui/button";
import { SettingsFeedback } from "@/components/configuracoes/shared/settings-feedback";
import { useDashboardSettings } from "@/hooks/configuracoes/use-dashboard-settings";

export function DashboardSettingsSection() {
  const {
    form,
    loading,
    saving,
    success,
    error,
    updateField,
    handleSave,
    handleResetDismissed,
  } = useDashboardSettings();

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure a exibição e o comportamento dos insights do dashboard.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">
            Exibir insights
          </label>

          <select
            value={form.enabled ? "enabled" : "disabled"}
            onChange={(e) =>
              updateField("enabled", e.target.value === "enabled")
            }
            className="h-11 rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
            disabled={loading}
          >
            <option value="enabled">Sim</option>
            <option value="disabled">Não</option>
          </select>

          <p className="text-xs text-muted-foreground">
            Define se os insights aparecem ou não no dashboard.
          </p>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">
            Frequência dos insights
          </label>

          <select
            value={form.frequency}
            onChange={(e) =>
              updateField(
                "frequency",
                e.target.value as "daily" | "weekly" | "biweekly" | "monthly"
              )
            }
            className="h-11 rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
            disabled={loading}
          >
            <option value="daily">Diariamente</option>
            <option value="weekly">Semanalmente</option>
            <option value="biweekly">Quinzenalmente</option>
            <option value="monthly">Mensalmente</option>
          </select>

          <p className="text-xs text-muted-foreground">
            Define de quanto em quanto tempo os insights fechados podem
            reaparecer.
          </p>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">
            Quantidade máxima de insights
          </label>

          <select
            value={String(form.limit)}
            onChange={(e) => updateField("limit", Number(e.target.value))}
            className="h-11 rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
            disabled={loading}
          >
            <option value="2">2 insights</option>
            <option value="3">3 insights</option>
            <option value="4">4 insights</option>
            <option value="5">5 insights</option>
          </select>

          <p className="text-xs text-muted-foreground">
            Limita quantos insights podem aparecer ao mesmo tempo no dashboard.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="h-11 rounded-2xl border border-white/10 bg-white/10 px-5 text-white backdrop-blur-md hover:bg-white/20"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleResetDismissed}
          disabled={saving || loading}
          className="h-11 rounded-2xl"
        >
          Reexibir insights dispensados
        </Button>
      </div>

      <SettingsFeedback error={error} success={success} />
    </div>
  );
}