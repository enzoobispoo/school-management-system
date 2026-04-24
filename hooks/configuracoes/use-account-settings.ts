"use client";

import { useEffect, useState } from "react";

export function useAccountSettings() {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/settings/me", { cache: "no-store" });
        const result = await response.json();

        if (!response.ok) throw new Error(result.error);

        setForm({
          nome: result.nome || "",
          email: result.email || "",
          telefone: result.telefone || "",
        });
      } catch {
        setError("Não foi possível carregar sua conta.");
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

      const response = await fetch("/api/settings/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar.");
      }

      setSuccess("Conta atualizada com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar conta.");
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