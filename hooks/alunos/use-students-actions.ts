"use client";

import { useState } from "react";
import { toast } from "sonner";

export class ValidationError extends Error {
  field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.field = field;
  }
}

interface StudentPayload {
  [key: string]: unknown;
}

export function useStudentsActions(onSuccess: () => Promise<void>) {
  const [submitting, setSubmitting] = useState(false);

  async function handleCreateStudent(payload: StudentPayload) {
    try {
      setSubmitting(true);
      const response = await fetch("/api/alunos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new ValidationError(result.error || "Erro ao cadastrar aluno", result.field);
      toast.success("Aluno cadastrado com sucesso");
      await onSuccess();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateStudent(id: string, payload: StudentPayload) {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/alunos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new ValidationError(result.error || "Erro ao atualizar aluno", result.field);
      toast.success("Aluno atualizado com sucesso");
      await onSuccess();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteStudent(id: string) {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/alunos/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao excluir aluno");
      toast.success("Aluno excluído com sucesso");
      await onSuccess();
    } finally {
      setSubmitting(false);
    }
  }

  return { submitting, setSubmitting, handleCreateStudent, handleUpdateStudent, handleDeleteStudent };
}