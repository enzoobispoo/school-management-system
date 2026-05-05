"use client";

import { useEffect, useState } from "react";
import { useUnsavedChanges } from "@/hooks/shared/use-unsaved-changes";

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
  const [form, setForm] = useState<TeacherFormData>({ nome: "", email: "", telefone: "" });
  const [initialForm, setInitialForm] = useState<TeacherFormData>({ nome: "", email: "", telefone: "" });

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);
  const { guardClose } = useUnsavedChanges(isDirty);

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
      const filled = {
        nome: initialData?.nome ?? "",
        email: initialData?.email ?? "",
        telefone: initialData?.telefone ? formatPhone(initialData.telefone) : "",
      };
      setForm(filled);
      setInitialForm(filled);
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
    guardClose(() => {
      setCurrentOpen(false);
      resetForm();
      setInitialForm({ nome: "", email: "", telefone: "" });
    });
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
      setInitialForm({ nome: "", email: "", telefone: "" });
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
    isDirty,
    guardClose,
  };
}