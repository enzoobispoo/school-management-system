"use client";

import { Languages } from "lucide-react";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

const OPTIONS = [
  { value: "pt-BR", label: "PT" },
  { value: "en", label: "EN" },
  { value: "es", label: "ES" },
] as const;

export function HeaderLanguageSwitcher() {
  const { language, setLanguage, t } = useDashboardLanguage();

  return (
    <label className="hidden items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground md:inline-flex">
      <Languages className="h-3.5 w-3.5" />
      <span className="sr-only">{t("header.languageLabel")}</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as "pt-BR" | "en" | "es")}
        className="bg-transparent text-xs font-medium text-foreground outline-none"
        aria-label={t("header.languageLabel")}
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
