"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingsFeedback } from "@/components/configuracoes/shared/settings-feedback";
import { useSchoolSettings } from "@/hooks/configuracoes/use-school-settings";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10)
    return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

export function SchoolSettingsSection() {
  const { t } = useDashboardLanguage();
  const [portalEditable, setPortalEditable] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setPortalEditable(d.user?.role === "ADMIN"))
      .catch(() => setPortalEditable(false));
  }, []);

  const { form, loading, saving, success, error, updateField, handleSave } =
    useSchoolSettings(portalEditable);

  const successLabel =
    success && success.startsWith("settings.") ? t(success) : success;

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {t("settings.school.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("settings.school.subtitle")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              {t("settings.school.fieldSchoolName")}
            </label>
            <Input
              value={form.nomeEscola}
              onChange={(e) => updateField("nomeEscola", e.target.value)}
              className="h-11 rounded-2xl"
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              {t("settings.school.fieldCnpj")}
            </label>
            <Input
              value={form.cnpj}
              onChange={(e) => updateField("cnpj", e.target.value)}
              className="h-11 rounded-2xl"
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              {t("settings.school.fieldEmail")}
            </label>
            <Input
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="h-11 rounded-2xl"
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              {t("settings.school.fieldPhone")}
            </label>
            <Input
              value={form.telefone}
              onChange={(e) => updateField("telefone", maskPhone(e.target.value))}
              placeholder={t("settings.school.phonePlaceholder")}
              className="h-11 rounded-2xl"
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              {t("settings.school.fieldWhatsapp")}
            </label>
            <Input
              value={form.whatsapp}
              onChange={(e) => updateField("whatsapp", maskPhone(e.target.value))}
              placeholder={t("settings.school.phonePlaceholder")}
              className="h-11 rounded-2xl"
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              {t("settings.school.fieldPrimaryColor")}
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
            <label className="text-sm font-medium text-foreground">
              {t("settings.school.fieldLogoUrl")}
            </label>
            <Input
              value={form.logoUrl}
              onChange={(e) => updateField("logoUrl", e.target.value)}
              placeholder={t("settings.school.logoPlaceholder")}
              className="h-11 rounded-2xl"
              disabled={loading}
            />
          </div>

          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-medium text-foreground">
              {t("settings.school.fieldAddress")}
            </label>
            <Input
              value={form.endereco}
              onChange={(e) => updateField("endereco", e.target.value)}
              className="h-11 rounded-2xl"
              disabled={loading}
            />
          </div>

          {portalEditable ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-muted/20 px-4 py-3 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {t("settings.school.professorPortal")}
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    {t("settings.school.professorPortalHint")}
                  </p>
                </div>
                <Switch
                  checked={form.professorPortalEnabled}
                  onCheckedChange={(v) => updateField("professorPortalEnabled", v)}
                  disabled={loading || saving}
                  aria-label={t("settings.school.professorPortalAria")}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-[24px] border border-border bg-muted/30 p-5">
          <p className="text-sm font-medium text-foreground">
            {t("settings.school.previewTitle")}
          </p>

          <div className="mt-4 rounded-[20px] border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              {form.logoUrl ? (
                <Image
                  src={form.logoUrl}
                  alt={t("settings.school.previewSchoolLogoAlt")}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-2xl object-cover"
                  unoptimized
                />
              ) : (
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold text-white"
                  style={{ backgroundColor: form.corPrimaria || "#111111" }}
                >
                  {form.nomeEscola?.slice(0, 2).toUpperCase() ||
                    t("settings.school.previewFallbackInitials")}
                </div>
              )}

              <div>
                <p className="font-semibold text-foreground">
                  {form.nomeEscola || t("settings.school.previewSchoolNamePlaceholder")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("settings.school.previewSubtitle")}
                </p>
              </div>
            </div>

            <div
              className="mt-5 rounded-2xl px-4 py-3 text-sm font-medium text-white"
              style={{ backgroundColor: form.corPrimaria || "#111111" }}
            >
              {t("settings.school.previewChip")}
            </div>
          </div>
        </div>
      </div>

      <div>
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="h-8 rounded-md px-4"
        >
          {saving ? t("settings.school.saving") : t("settings.school.save")}
        </Button>
      </div>

      <SettingsFeedback error={error} success={successLabel} />
    </div>
  );
}