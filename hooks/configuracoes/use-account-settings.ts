"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAccountSettings() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    avatarUrl: "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [blobPreview, setBlobPreview] = useState<string | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!avatarFile) {
      setBlobPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setBlobPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const avatarPreviewSrc =
    avatarRemoved ? null : blobPreview ?? (form.avatarUrl.trim() || null);

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
          avatarUrl: typeof result.avatarUrl === "string" ? result.avatarUrl : "",
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

  function pickAvatarFile(file: File | null) {
    setAvatarRemoved(false);
    setAvatarFile(file);
  }

  function markRemoveAvatar() {
    setAvatarFile(null);
    setAvatarRemoved(true);
    updateField("avatarUrl", "");
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const fd = new FormData();
      fd.append("nome", form.nome.trim());
      fd.append("email", form.email.trim());
      fd.append("telefone", form.telefone.trim());
      if (avatarRemoved) {
        fd.append("avatarClear", "1");
      } else if (avatarFile) {
        fd.append("avatar", avatarFile);
      } else {
        fd.append("avatarUrl", form.avatarUrl.trim());
      }

      const response = await fetch("/api/settings/me", {
        method: "PUT",
        body: fd,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar.");
      }

      setForm({
        nome: result.nome || "",
        email: result.email || "",
        telefone: result.telefone || "",
        avatarUrl: typeof result.avatarUrl === "string" ? result.avatarUrl : "",
      });
      setAvatarFile(null);
      setAvatarRemoved(false);
      setSuccess("Perfil atualizado com sucesso.");
      router.refresh();
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
    avatarPreviewSrc,
    pickAvatarFile,
    markRemoveAvatar,
  };
}
