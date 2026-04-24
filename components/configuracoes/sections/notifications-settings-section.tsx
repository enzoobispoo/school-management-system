"use client";

import { Button } from "@/components/ui/button";
import { SettingsFeedback } from "@/components/configuracoes/shared/settings-feedback";
import { useNotificationsSettings } from "@/hooks/configuracoes/use-notifications-settings";

export function NotificationsSettingsSection() {
  const { form, loading, saving, success, error, updateField, handleSave } =
    useNotificationsSettings();

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Notificações</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Controle alertas e lembretes automáticos do sistema.
        </p>
      </div>

      <div className="grid gap-3">
        <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4">
          <input
            type="checkbox"
            checked={form.notificarNovoAluno}
            onChange={(e) => updateField("notificarNovoAluno", e.target.checked)}
            disabled={loading}
          />
          <span className="text-sm text-foreground">
            Notificar quando houver novo aluno
          </span>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4">
          <input
            type="checkbox"
            checked={form.notificarPagamento}
            onChange={(e) => updateField("notificarPagamento", e.target.checked)}
            disabled={loading}
          />
          <span className="text-sm text-foreground">
            Notificar pagamentos confirmados
          </span>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4">
          <input
            type="checkbox"
            checked={form.notificarAtraso}
            onChange={(e) => updateField("notificarAtraso", e.target.checked)}
            disabled={loading}
          />
          <span className="text-sm text-foreground">
            Notificar pagamentos em atraso
          </span>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4">
          <input
            type="checkbox"
            checked={form.enviarLembreteAuto}
            onChange={(e) => updateField("enviarLembreteAuto", e.target.checked)}
            disabled={loading}
          />
          <span className="text-sm text-foreground">
            Enviar lembrete automático de cobrança
          </span>
        </label>
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