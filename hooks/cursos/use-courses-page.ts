"use client";

import { useCoursesActions } from "@/hooks/cursos/use-courses-actions";
import { useCoursesModals } from "@/hooks/cursos/use-courses-modals";
import { useCoursesQuery } from "@/hooks/cursos/use-courses-query";

export function useCoursesPage() {
  const query = useCoursesQuery();
  const actions = useCoursesActions(query.fetchCourses);
  const modals = useCoursesModals();

  async function submitEditCourse(payload: {
    nome: string;
    categoria: string;
    descricao?: string;
    duracaoTexto?: string;
    valorMensal: number;
    ativo?: boolean;
  }) {
    if (!modals.editingCourse) return;

    try {
      actions.setSubmitting(true);
      await actions.handleUpdateCourse(modals.editingCourse.id, payload);
      modals.closeEditModal(false);
    } finally {
      actions.setSubmitting(false);
    }
  }

  async function confirmToggleCourseStatus() {
    if (!modals.courseToDelete) return;

    try {
      actions.setSubmitting(true);
      await actions.handleToggleCourseStatus(modals.courseToDelete);
      modals.closeDeleteModal();
    } catch (err) {
      query.setError(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar o curso."
      );
    } finally {
      actions.setSubmitting(false);
    }
  }

  return {
    ...query,
    ...actions,
    ...modals,
    submitEditCourse,
    confirmToggleCourseStatus,
  };
}