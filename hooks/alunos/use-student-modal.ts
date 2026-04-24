"use client";

import { useEffect, useState } from "react";

interface StudentFormData {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  dataNascimento: string;
  endereco: string;
  responsavelNome: string;
  responsavelTelefone: string;
  responsavelEmail: string;
}

interface UseStudentModalParams {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: {
    nome?: string;
    email?: string;
    cpf?: string;
    telefone?: string;
    dataNascimento?: string;
    endereco?: string;
    responsavelNome?: string;
    responsavelTelefone?: string;
    responsavelEmail?: string;
  } | null;
  onSubmit: (payload: {
    nome: string;
    email?: string;
    cpf?: string;
    telefone?: string;
    dataNascimento?: string;
    endereco?: string;
    responsavelNome?: string;
    responsavelTelefone?: string;
    responsavelEmail?: string;
  }) => Promise<void>;
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
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

export function useStudentModal({
  open,
  onOpenChange,
  initialData = null,
  onSubmit,
}: UseStudentModalParams) {
  const isControlled = open !== undefined;

  const [internalOpen, setInternalOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<StudentFormData>({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    dataNascimento: "",
    endereco: "",
    responsavelNome: "",
    responsavelTelefone: "",
    responsavelEmail: "",
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
        cpf: initialData?.cpf ? formatCpf(initialData.cpf) : "",
        telefone: initialData?.telefone ? formatPhone(initialData.telefone) : "",
        dataNascimento: initialData?.dataNascimento ?? "",
        endereco: initialData?.endereco ?? "",
        responsavelNome: initialData?.responsavelNome ?? "",
        responsavelTelefone: initialData?.responsavelTelefone
          ? formatPhone(initialData.responsavelTelefone)
          : "",
        responsavelEmail: initialData?.responsavelEmail ?? "",
      });
      setError("");
    }
  }, [currentOpen, initialData]);

  function updateField(field: keyof StudentFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm({
      nome: "",
      email: "",
      cpf: "",
      telefone: "",
      dataNascimento: "",
      endereco: "",
      responsavelNome: "",
      responsavelTelefone: "",
      responsavelEmail: "",
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
        cpf: form.cpf.trim() || undefined,
        telefone: form.telefone.trim() || undefined,
        dataNascimento: form.dataNascimento || undefined,
        endereco: form.endereco.trim() || undefined,
        responsavelNome: form.responsavelNome.trim() || undefined,
        responsavelTelefone: form.responsavelTelefone.trim() || undefined,
        responsavelEmail: form.responsavelEmail.trim() || undefined,
      });

      resetForm();
      setCurrentOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Não foi possível salvar o aluno.";
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
    formatCpf,
    formatPhone,
  };
}