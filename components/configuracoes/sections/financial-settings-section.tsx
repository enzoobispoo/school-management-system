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
          Defina regras padrão para mensalidades, boletos e automações de cobrança.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
            onChange={(e) =>
              updateField("metodoPagamentoPadrao", e.target.value)
            }
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
            onChange={(e) =>
              updateField("multaAtrasoPercentual", e.target.value)
            }
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
            onChange={(e) =>
              updateField("jurosMensalPercentual", e.target.value)
            }
            className="h-11 rounded-2xl"
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid gap-4">
        <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4">
          <input
            type="checkbox"
            checked={form.gerarMensalidadeAuto}
            onChange={(e) =>
              updateField("gerarMensalidadeAuto", e.target.checked)
            }
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
            onChange={(e) =>
              updateField("enviarLembreteAuto", e.target.checked)
            }
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

      <div className="grid gap-4 rounded-[24px] border border-border bg-card p-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Provedor de cobrança
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure a integração responsável pela emissão de cobranças e boletos.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              Provedor
            </label>
            <select
              value={form.billingProvider}
              onChange={(e) => updateField("billingProvider", e.target.value)}
              className="h-11 rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
              disabled={loading}
            >
              <option value="asaas">Asaas</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              Ambiente
            </label>
            <select
              value={form.asaasEnvironment}
              onChange={(e) => updateField("asaasEnvironment", e.target.value)}
              className="h-11 rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
              disabled={loading}
            >
              <option value="sandbox">Sandbox</option>
              <option value="production">Produção</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              API Key do Asaas
            </label>
            <Input
              value={form.asaasApiKey}
              onChange={(e) => updateField("asaasApiKey", e.target.value)}
              placeholder="$aact_..."
              className="h-11 rounded-2xl"
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              Wallet ID do Asaas
            </label>
            <Input
              value={form.asaasWalletId}
              onChange={(e) => updateField("asaasWalletId", e.target.value)}
              placeholder="Opcional"
              className="h-11 rounded-2xl"
              disabled={loading}
            />
          </div>

          <div className="grid gap-2 md:max-w-sm">
            <label className="text-sm font-medium text-foreground">
              Método padrão de cobrança
            </label>
            <select
              value={form.defaultChargeMethod}
              onChange={(e) =>
                updateField("defaultChargeMethod", e.target.value)
              }
              className="h-11 rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
              disabled={loading}
            >
              <option value="boleto">Boleto</option>
              <option value="pix">Pix</option>
              <option value="cartao">Cartão</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4">
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4">
            <input
              type="checkbox"
              checked={form.billingEnabled}
              onChange={(e) =>
                updateField("billingEnabled", e.target.checked)
              }
              disabled={loading}
            />
            <div>
              <span className="text-sm font-medium text-foreground">
                Ativar integração de cobrança
              </span>
              <p className="text-xs text-muted-foreground">
                Libera geração de boletos e integrações com o Asaas.
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4">
            <input
              type="checkbox"
              checked={form.autoGenerateBoleto}
              onChange={(e) =>
                updateField("autoGenerateBoleto", e.target.checked)
              }
              disabled={loading}
            />
            <div>
              <span className="text-sm font-medium text-foreground">
                Gerar boleto automaticamente nas mensalidades
              </span>
              <p className="text-xs text-muted-foreground">
                Ao criar novas mensalidades, o sistema já emite o boleto.
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4">
            <input
              type="checkbox"
              checked={form.autoSendBoletoWhatsApp}
              onChange={(e) =>
                updateField("autoSendBoletoWhatsApp", e.target.checked)
              }
              disabled={loading}
            />
            <div>
              <span className="text-sm font-medium text-foreground">
                Enviar boleto automaticamente no WhatsApp
              </span>
              <p className="text-xs text-muted-foreground">
                Quando um boleto for gerado, o sistema envia o link automaticamente.
              </p>
            </div>
          </label>
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