"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SettingsFeedback } from "@/components/configuracoes/shared/settings-feedback";
import { useFinancialSettings } from "@/hooks/configuracoes/use-financial-settings";

export function FinancialSettingsSection() {
  const { form, loading, saving, success, error, updateField, handleSave } =
    useFinancialSettings();

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Financeiro</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Defina regras padrão para mensalidades e automações de cobrança.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">
            Meta mensal (R$)
          </label>
          <Input
            type="number"
            step="0.01"
            value={form.metaMensal}
            onChange={(e) => updateField("metaMensal", e.target.value)}
            placeholder="Ex: 10000"
            className="h-11 rounded-2xl"
            disabled={loading}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">
            Dia padrão de vencimento
          </label>
          <Input
            type="number"
            value={form.diaVencimentoPadrao}
            onChange={(e) => updateField("diaVencimentoPadrao", e.target.value)}
            className="h-11 rounded-2xl"
            disabled={loading}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">
            Método de pagamento padrão
          </label>
          <Input
            value={form.metodoPagamentoPadrao}
            onChange={(e) => updateField("metodoPagamentoPadrao", e.target.value)}
            placeholder="Ex: PIX"
            className="h-11 rounded-2xl"
            disabled={loading}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">
            Multa por atraso (%)
          </label>
          <Input
            type="number"
            step="0.01"
            value={form.multaAtrasoPercentual}
            onChange={(e) => updateField("multaAtrasoPercentual", e.target.value)}
            className="h-11 rounded-2xl"
            disabled={loading}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">
            Juros mensal (%)
          </label>
          <Input
            type="number"
            step="0.01"
            value={form.jurosMensalPercentual}
            onChange={(e) => updateField("jurosMensalPercentual", e.target.value)}
            className="h-11 rounded-2xl"
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">
            Ação na assinatura por inadimplência
          </label>
          <select
            value={form.subscriptionInadimplenciaAction}
            onChange={(e) =>
              updateField(
                "subscriptionInadimplenciaAction",
                e.target.value as "SUSPENDER" | "CANCELAR"
              )
            }
            className="h-11 rounded-2xl border border-input bg-background px-3 text-sm"
            disabled={loading}
          >
            <option value="SUSPENDER">Suspender assinatura</option>
            <option value="CANCELAR">Cancelar assinatura</option>
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">
            Aplicar ação na assinatura após (dias)
          </label>
          <Input
            type="number"
            min={1}
            value={form.subscriptionInadimplenciaDias}
            onChange={(e) =>
              updateField("subscriptionInadimplenciaDias", e.target.value)
            }
            className="h-11 rounded-2xl"
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid gap-3">
        <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4">
          <input
            type="checkbox"
            checked={form.gerarMensalidadeAuto}
            onChange={(e) => updateField("gerarMensalidadeAuto", e.target.checked)}
            disabled={loading}
          />
          <div>
            <span className="text-sm font-medium text-foreground">
              Gerar mensalidades automaticamente
            </span>
            <p className="text-xs text-muted-foreground">
              Cria novas mensalidades com base nas matrículas ativas.
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4">
          <input
            type="checkbox"
            checked={form.enviarLembreteAuto}
            onChange={(e) => updateField("enviarLembreteAuto", e.target.checked)}
            disabled={loading}
          />
          <div>
            <span className="text-sm font-medium text-foreground">
              Enviar lembretes automáticos de atraso
            </span>
            <p className="text-xs text-muted-foreground">
              O sistema envia mensagens automáticas para pagamentos vencidos.
            </p>
          </div>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">
            Régua automática de cobrança (dias)
          </label>
          <Input
            value={form.reguaCobrancaDias}
            onChange={(e) => updateField("reguaCobrancaDias", e.target.value)}
            placeholder="Ex: 1,3,7"
            className="h-11 rounded-2xl"
            disabled={loading}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">
            Suspender após inadimplência (dias)
          </label>
          <Input
            type="number"
            min={1}
            value={form.suspenderAposInadimplenciaDias}
            onChange={(e) =>
              updateField("suspenderAposInadimplenciaDias", e.target.value)
            }
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
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>

      <SettingsFeedback error={error} success={success} />
    </div>
  );
}
