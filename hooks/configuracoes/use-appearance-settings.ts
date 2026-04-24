"use client";

import { useEffect, useState } from "react";

function applyAppearance(theme: string, density: string) {
  const root = document.documentElement;

  const isDark = theme === "dark";

  root.classList.toggle("dark", isDark);
  root.setAttribute("data-density", density);
  root.style.colorScheme = isDark ? "dark" : "light";
}

export function useAppearanceSettings() {
  const [form, setForm] = useState({
    tema: "light",
    densidade: "comfortable",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/settings/aparencia", {
          cache: "no-store",
        });
        const result = await response.json();

        const tema = result.temaPadrao || "light";
        const densidade = result.densidade || "comfortable";

        setForm({ tema, densidade });

        applyAppearance(tema, densidade);
      } catch {
        setError("Não foi possível carregar as preferências de aparência.");
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

      const response = await fetch("/api/settings/aparencia", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temaPadrao: form.tema,
          densidade: form.densidade,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar.");
      }

      applyAppearance(form.tema, form.densidade);

      setSuccess("Aparência atualizada com sucesso.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar aparência."
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