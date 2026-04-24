"use client";

import { useEffect, useState } from "react";

export function useAiSettings() {
  const [form, setForm] = useState({
    providerMode: "PLATFORM" as "PLATFORM" | "CUSTOM",
    apiKey: "",
    monthlyLimit: "1000",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/settings/ia", {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok) throw new Error(result.error);

        setForm({
          providerMode: result.aiProviderMode ?? "PLATFORM",
          apiKey: result.openaiApiKey ?? "",
          monthlyLimit: String(result.aiMonthlyLimit ?? 1000),
        });
      } catch {
        setError("Não foi possível carregar as configurações da IA.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/settings/ia", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiProviderMode: form.providerMode,
          openaiApiKey: form.apiKey,
          aiMonthlyLimit: Number(form.monthlyLimit),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar.");
      }

      setSuccess("Configurações da IA salvas com sucesso.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar configurações."
      );
    } finally {
      setSaving(false);
    }
  }

  return {
    form,
    loading,
    saving,
    success,
    error,
    updateField,
    handleSave,
  };
}