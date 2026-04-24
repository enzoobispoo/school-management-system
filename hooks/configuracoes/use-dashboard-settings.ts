"use client";

import { useEffect, useState } from "react";

type Frequency = "daily" | "weekly" | "biweekly" | "monthly";

interface DashboardSettingsState {
  frequency: Frequency;
  enabled: boolean;
  limit: number;
}

export function useDashboardSettings() {
  const [form, setForm] = useState<DashboardSettingsState>({
    frequency: "weekly",
    enabled: true,
    limit: 3,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function updateField<K extends keyof DashboardSettingsState>(
    field: K,
    value: DashboardSettingsState[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSuccess("");
    setError("");
  }

  async function fetchSettings() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/users/me/dashboard-insights", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Falha ao carregar configurações do dashboard");
      }

      const result = await response.json();

      setForm({
        frequency: (result.frequency as Frequency) ?? "weekly",
        enabled: result.enabled ?? true,
        limit: result.limit ?? 3,
      });
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar as configurações do dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/users/me/dashboard-insights", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frequency: form.frequency,
          enabled: form.enabled,
          limit: form.limit,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar configurações do dashboard");
      }

      setSuccess("Configurações do dashboard salvas com sucesso.");
    } catch (err) {
      console.error(err);
      setError("Não foi possível salvar as configurações do dashboard.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetDismissed() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/users/me/dashboard-insights", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reset: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao reexibir insights dispensados");
      }

      setSuccess("Insights dispensados foram reexibidos com sucesso.");
    } catch (err) {
      console.error(err);
      setError("Não foi possível reexibir os insights dispensados.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    form,
    loading,
    saving,
    success,
    error,
    updateField,
    handleSave,
    handleResetDismissed,
    refetchSettings: fetchSettings,
  };
}