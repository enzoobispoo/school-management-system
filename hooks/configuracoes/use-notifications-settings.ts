"use client";

import { useEffect, useState } from "react";

export function useNotificationsSettings() {
  const [form, setForm] = useState({
    notificarNovoAluno: true,
    notificarPagamento: true,
    notificarAtraso: true,
    enviarLembreteAuto: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/settings/notificacoes", {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok) throw new Error(result.error);

        setForm({
          notificarNovoAluno: !!result.notificarNovoAluno,
          notificarPagamento: !!result.notificarPagamento,
          notificarAtraso: !!result.notificarAtraso,
          enviarLembreteAuto: !!result.enviarLembreteAuto,
        });
      } catch {
        setError("Não foi possível carregar as notificações.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function updateField(key: keyof typeof form, value: boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/settings/notificacoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar.");
      }

      setSuccess("Notificações salvas com sucesso.");
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