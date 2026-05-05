"use client";

import { useEffect, useState } from "react";
import { useUnsavedChanges } from "@/hooks/shared/use-unsaved-changes";

interface CourseFormData {
  nome: string;
  categoria: string;
  duracaoTexto: string;
  valorMensal: string;
  descricao: string;
}

interface UseCourseModalParams {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: {
    nome?: string;
    categoria?: string;
    descricao?: string;
    duracaoTexto?: string;
    valorMensal?: number;
    ativo?: boolean;
  } | null;
  onSubmit: (payload: {
    nome: string;
    categoria: string;
    descricao?: string;
    duracaoTexto?: string;
    valorMensal: number;
    ativo?: boolean;
  }) => Promise<void>;
}

const emptyForm: CourseFormData = {
  nome: "",
  categoria: "",
  duracaoTexto: "",
  valorMensal: "",
  descricao: "",
};

export function useCourseModal({
  open,
  onOpenChange,
  initialData = null,
  onSubmit,
}: UseCourseModalParams) {
  const isControlled = open !== undefined;

  const [internalOpen, setInternalOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<CourseFormData>(emptyForm);
  const [initialForm, setInitialForm] = useState<CourseFormData>(emptyForm);

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
      const filled: CourseFormData = {
        nome: initialData?.nome ?? "",
        categoria: initialData?.categoria ?? "",
        duracaoTexto: initialData?.duracaoTexto ?? "",
        valorMensal:
          initialData?.valorMensal !== undefined
            ? String(initialData.valorMensal)
            : "",
        descricao: initialData?.descricao ?? "",
      };
      setForm(filled);
      setInitialForm(filled);
      setError("");
    }
  }, [currentOpen, initialData]);

  function updateField(field: keyof CourseFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setInitialForm(emptyForm);
    setError("");
  }

  function closeModal() {
    guardClose(() => {
      setCurrentOpen(false);
      resetForm();
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!form.nome.trim()) {
      setError("Nome do curso é obrigatório.");
      return;
    }

    if (!form.categoria.trim()) {
      setError("Categoria é obrigatória.");
      return;
    }

    if (!form.valorMensal.trim()) {
      setError("Valor mensal é obrigatório.");
      return;
    }

    const valor = Number(form.valorMensal.replace(",", "."));

    if (Number.isNaN(valor) || valor <= 0) {
      setError("Informe um valor mensal válido.");
      return;
    }

    try {
      await onSubmit({
        nome: form.nome.trim(),
        categoria: form.categoria,
        descricao: form.descricao.trim() || undefined,
        duracaoTexto: form.duracaoTexto.trim() || undefined,
        valorMensal: valor,
        ativo: true,
      });

      resetForm();
      setCurrentOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Não foi possível salvar o curso.";
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
    isDirty,
    guardClose,
  };
}
