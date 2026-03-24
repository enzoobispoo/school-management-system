"use client";

import { useState } from "react";
import type { CourseCardItem } from "@/hooks/cursos/use-courses-query";

interface CoursePayload {
  nome: string;
  categoria: string;
  descricao?: string;
  duracaoTexto?: string;
  valorMensal: number;
  ativo?: boolean;
}

export function useCoursesActions(onSuccess: () => Promise<void>) {
  const [submitting, setSubmitting] = useState(false);

  async function handleCreateCourse(payload: CoursePayload) {
    try {
      setSubmitting(true);

      const response = await fetch("/api/cursos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao criar curso");
      }

      await onSuccess();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateCourse(id: string, payload: CoursePayload) {
    const response = await fetch(`/api/cursos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Erro ao atualizar curso");
    }

    await onSuccess();
  }

  async function handleToggleCourseStatus(course: CourseCardItem) {
    const response = await fetch(`/api/cursos/${course.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome: course.name,
        categoria: course.category,
        duracaoTexto: course.duration !== "-" ? course.duration : undefined,
        valorMensal: course.price,
        ativo: !course.active,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Erro ao atualizar status do curso");
    }

    await onSuccess();
  }

  return {
    submitting,
    setSubmitting,
    handleCreateCourse,
    handleUpdateCourse,
    handleToggleCourseStatus,
  };
}