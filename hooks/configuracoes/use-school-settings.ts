"use client";

import { useEffect, useState } from "react";

interface SchoolSettingsForm {
  nomeEscola: string;
  cnpj: string;
  email: string;
  telefone: string;
  whatsapp: string;
  endereco: string;
  logoUrl: string;
  corPrimaria: string;
  professorPortalEnabled: boolean;
}

export function useSchoolSettings(portalEditable: boolean) {
  const [form, setForm] = useState<SchoolSettingsForm>({
    nomeEscola: "",
    cnpj: "",
    email: "",
    telefone: "",
    whatsapp: "",
    endereco: "",
    logoUrl: "",
    corPrimaria: "#111111",
    professorPortalEnabled: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function updateField<K extends keyof SchoolSettingsForm>(
    field: K,
    value: SchoolSettingsForm[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/settings/escola", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error || "Não foi possível carregar as configurações.");
        }

        setForm({
          nomeEscola: result.nomeEscola ?? "",
          cnpj: result.cnpj ?? "",
          email: result.email ?? "",
          telefone: result.telefone ?? "",
          whatsapp: result.whatsapp ?? "",
          endereco: result.endereco ?? "",
          logoUrl: result.logoUrl ?? "",
          corPrimaria: result.corPrimaria ?? "#111111",
          professorPortalEnabled: result.professorPortalEnabled !== false,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Não foi possível carregar as configurações."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  async function handleSave() {
    try {
      setSaving(true);
      setSuccess("");
      setError("");

      const response = await fetch("/api/settings/escola", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeEscola: form.nomeEscola,
          cnpj: form.cnpj || null,
          email: form.email || null,
          telefone: form.telefone || null,
          whatsapp: form.whatsapp || null,
          endereco: form.endereco || null,
          logoUrl: form.logoUrl || null,
          corPrimaria: form.corPrimaria || "#111111",
          ...(portalEditable ?
            { professorPortalEnabled: form.professorPortalEnabled }
          : {}),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Não foi possível salvar as configurações.");
      }

      setSuccess("settings.school.saveSuccess");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível salvar as configurações."
      );
    } finally {
      setSaving(false);
    }
  }

  return { form, loading, saving, success, error, updateField, handleSave };
}
