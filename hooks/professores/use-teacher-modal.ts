"use client";

import { useEffect, useState } from "react";

interface TeacherFormData {
  nome: string;
  email: string;
  telefone: string;
}

interface UseTeacherModalParams {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: {
    nome?: string;
    email?: string;
    telefone?: string;
    ativo?: boolean;
  } | null;
  onSubmit: (payload: {
    nome: string;
    email?: string;
    telefone?: string;
    ativo?: boolean;
  }) => Promise<void>;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function useTeacherModal({
  open,
  onOpenChange,
  initialData = null,
  onSubmit,
}: UseTeacherModalParams) {
  const isControlled = open !== undefined;

  const [internalOpen, setInternalOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<TeacherFormData>({
    nome: "",
    email: "",
    telefone: "",
  });

  const currentOpen = isControlled ? open : internalOpen;

  function setCurrentOpen(next: boolean) {
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  }

  useEffect(() => {
    if (currentOpen) {
      setForm({
        nome: initialData?.nome ?? "",
        email: initialData?.email ?? "",
        telefone: initialData?.telefone
          ? formatPhone(initialData.telefone)
          : "",
      });
      setError("");
    }
  }, [currentOpen, initialData]);

  function updateField(field: keyof TeacherFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm({
      nome: "",
      email: "",
      telefone: "",
    });
    setError("");
  }

  function closeModal() {
    setCurrentOpen(false);
    resetForm();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!form.nome.trim()) {
      setError("Nome é obrigatório.");
      return;
    }

    try {
      await onSubmit({
        nome: form.nome.trim(),
        email: form.email.trim() || undefined,
        telefone: form.telefone.trim() || undefined,
        ativo: true,
      });

      resetForm();
      setCurrentOpen(false);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível salvar o professor.";
      setError(message);
    }
  }

  return {
    currentOpen,
    setCurrentOpen,
    form,
    error,
    updateField,
    closeModal,
    handleSubmit,
    formatPhone,
  };
}