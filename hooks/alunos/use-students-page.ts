"use client";

import { useStudentsActions } from "@/hooks/alunos/use-students-actions";
import { useStudentsAdvancedFilters } from "@/hooks/alunos/use-students-advanced-filters";
import { useStudentsModals } from "@/hooks/alunos/use-students-modals";
import { useStudentsQuery } from "@/hooks/alunos/use-students-query";

export function useStudentsPage() {
  const query = useStudentsQuery();
  const actions = useStudentsActions(query.fetchStudents);
  const modals = useStudentsModals();
  const advancedFilters = useStudentsAdvancedFilters({
    students: query.students,
  });

  async function submitEditStudent(payload: {
    nome: string;
    email?: string;
    cpf?: string;
    telefone?: string;
    dataNascimento?: string;
    endereco?: string;
  }) {
    if (!modals.editingStudent) return;

    try {
      actions.setSubmitting(true);
      await actions.handleUpdateStudent(modals.editingStudent.id, payload);
      modals.setEditOpen(false);
      modals.setEditingStudent(null);
    } finally {
      actions.setSubmitting(false);
    }
  }

  async function confirmDeleteStudent() {
    if (!modals.studentToDelete) return;

    try {
      actions.setSubmitting(true);
      await actions.handleDeleteStudent(modals.studentToDelete.id);
      modals.closeDeleteModal();
    } catch (err) {
      query.setError(
        err instanceof Error ? err.message : "Não foi possível excluir o aluno."
      );
    } finally {
      actions.setSubmitting(false);
    }
  }

  return {
    ...query,
    ...actions,
    ...modals,
    ...advancedFilters,
    submitEditStudent,
    confirmDeleteStudent,
  };
}