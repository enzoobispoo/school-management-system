"use client";

import { useTeachersActions } from "@/hooks/professores/use-teachers-actions";
import { useTeachersModals } from "@/hooks/professores/use-teachers-modals";
import { useTeachersQuery } from "@/hooks/professores/use-teachers-query";

export function useTeachersPage() {
  const query = useTeachersQuery();
  const actions = useTeachersActions(query.fetchTeachers);
  const modals = useTeachersModals();

  async function submitEditTeacher(payload: {
    nome: string;
    email?: string;
    telefone?: string;
    ativo?: boolean;
  }) {
    if (!modals.editingTeacher) return;

    try {
      actions.setSubmitting(true);
      await actions.handleUpdateTeacher(modals.editingTeacher.id, payload);
      modals.closeEditModal(false);
    } finally {
      actions.setSubmitting(false);
    }
  }

  async function confirmToggleTeacherStatus() {
    if (!modals.teacherToToggle) return;

    try {
      actions.setSubmitting(true);
      await actions.handleToggleTeacherStatus(modals.teacherToToggle);
      modals.closeToggleModal();
    } catch (err) {
      query.setError(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar o professor."
      );
    } finally {
      actions.setSubmitting(false);
    }
  }

  return {
    ...query,
    ...actions,
    ...modals,
    submitEditTeacher,
    confirmToggleTeacherStatus,
  };
}