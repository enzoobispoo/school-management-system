"use client";

import { useState } from "react";

interface StudentPayload {
  nome: string;
  email?: string;
  cpf?: string;
  telefone?: string;
  dataNascimento?: string;
  endereco?: string;
  responsavelNome?: string;
  responsavelTelefone?: string;
  responsavelEmail?: string;
}

export function useStudentsActions(onSuccess: () => Promise<void>) {
  const [submitting, setSubmitting] = useState(false);

  async function handleCreateStudent(payload: StudentPayload) {
    try {
      setSubmitting(true);

      const response = await fetch("/api/alunos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao cadastrar aluno");
      }

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao atualizar aluno");
      }

      await onSuccess();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteStudent(id: string) {
    try {
      setSubmitting(true);

      const response = await fetch(`/api/alunos/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao excluir aluno");
      }

      await onSuccess();
    } finally {
      setSubmitting(false);
    }
  }

  return {
    submitting,
    setSubmitting,
    handleCreateStudent,
    handleUpdateStudent,
    handleDeleteStudent,
  };
}