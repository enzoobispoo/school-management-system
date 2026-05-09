"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SettingsFeedback } from "@/components/configuracoes/shared/settings-feedback";
import { useFinancialSettings } from "@/hooks/configuracoes/use-financial-settings";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";
import { PAYOUT_BANK_SLUGS } from "@/lib/finance/payout-bank-options";

export function FinancialSettingsSection() {
  const { t } = useDashboardLanguage();
  const { form, loading, saving, success, error, updateField, handleSave } =
    useFinancialSettings();

  const successLabel =
    success && success.startsWith("settings.") ? t(success) : success;

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {t("settings.financial.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("settings.financial.intro")}
        </p>
      </div>

      {form.planTier === "full" ?
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 dark:bg-primary/10">
          <h3 className="text-sm font-semibold text-foreground">
            {t("settings.financial.payoutSectionTitle")}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("settings.financial.payoutSectionIntro")}
          </p>
          <div className="mt-3 grid gap-2">
            <label className="text-sm font-medium text-foreground">
              {t("settings.financial.payoutBankLabel")}
            </label>
            <select
              value={form.payoutBankSlug}
              onChange={(e) => updateField("payoutBankSlug", e.target.value)}
              className="h-11 rounded-2xl border border-input bg-background px-3 text-sm"
              disabled={loading}
            >
              <option value="">{t("settings.financial.payoutBankPlaceholder")}</option>
              {PAYOUT_BANK_SLUGS.map((slug) => (
                <option key={slug} value={slug}>
                  {t(`settings.payoutBank.${slug}`)}
                </option>
              ))}
            </select>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {t("settings.financial.payoutBankHint")}
            </p>
          </div>
        </div>
      : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">
            {t("settings.financial.metaMonthly")}
          </label>
          <Input
            type="number"
            step="0.01"
            value={form.metaMensal}
            onChange={(e) => updateField("metaMensal", e.target.value)}
            placeholder={t("settings.financial.metaMonthlyPlaceholder")}
            className="h-11 rounded-2xl"
            disabled={loading}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">
            {t("settings.financial.dueDay")}
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
            {t("settings.financial.paymentMethodDefault")}
          </label>
          <Input
            value={form.metodoPagamentoPadrao}
            onChange={(e) => updateField("metodoPagamentoPadrao", e.target.value)}
            placeholder={t("settings.financial.paymentMethodPlaceholder")}
            className="h-11 rounded-2xl"
            disabled={loading}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">
            {t("settings.financial.lateFee")}
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
            {t("settings.financial.monthlyInterest")}
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
            {t("settings.financial.subscriptionAction")}
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
            <option value="SUSPENDER">{t("settings.financial.subscriptionSuspend")}</option>
            <option value="CANCELAR">{t("settings.financial.subscriptionCancel")}</option>
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">
            {t("settings.financial.subscriptionActionDays")}
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
              {t("settings.financial.autoInstallments")}
            </span>
            <p className="text-xs text-muted-foreground">
              {t("settings.financial.autoInstallmentsHint")}
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
              {t("settings.financial.autoReminders")}
            </span>
            <p className="text-xs text-muted-foreground">
              {t("settings.financial.autoRemindersHint")}
            </p>
          </div>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">
            {t("settings.financial.collectionCadence")}
          </label>
          <Input
            value={form.reguaCobrancaDias}
            onChange={(e) => updateField("reguaCobrancaDias", e.target.value)}
            placeholder={t("settings.financial.collectionCadencePlaceholder")}
            className="h-11 rounded-2xl"
            disabled={loading}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">
            {t("settings.financial.suspendAfterDays")}
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
          onClick={() => void handleSave()}
          disabled={saving || loading}
          className="h-8 rounded-md px-4"
        >
          {saving ? t("settings.financial.saving") : t("settings.financial.save")}
        </Button>
      </div>

      <SettingsFeedback error={error} success={successLabel} />
    </div>
  );
}
