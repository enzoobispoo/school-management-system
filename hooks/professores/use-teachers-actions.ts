"use client";

import { useState } from "react";
import type { TeacherCardItem } from "@/hooks/professores/use-teachers-query";

interface TeacherPayload {
  nome: string;
  email?: string;
  telefone?: string;
  ativo?: boolean;
}

export function useTeachersActions(onSuccess: () => Promise<void>) {
  const [submitting, setSubmitting] = useState(false);

  async function handleCreateTeacher(payload: TeacherPayload) {
    try {
      setSubmitting(true);

      const response = await fetch("/api/professores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao cadastrar professor");
      }

      await onSuccess();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateTeacher(id: string, payload: TeacherPayload) {
    const response = await fetch(`/api/professores/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Erro ao atualizar professor");
    }

    await onSuccess();
  }

  async function handleToggleTeacherStatus(teacher: TeacherCardItem) {
    const response = await fetch(`/api/professores/${teacher.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome: teacher.name,
        email: teacher.email !== "-" ? teacher.email : undefined,
        telefone: teacher.phone !== "-" ? teacher.phone : undefined,
        ativo: !teacher.active,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Erro ao atualizar status do professor");
    }

    await onSuccess();
  }

  return {
    submitting,
    setSubmitting,
    handleCreateTeacher,
    handleUpdateTeacher,
    handleToggleTeacherStatus,
  };
}