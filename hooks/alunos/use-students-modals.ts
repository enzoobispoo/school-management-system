"use client";

import { useState } from "react";
import type { StudentTableItem } from "@/hooks/alunos/use-students-query";

type EditingStudent = {
  id: string;
  nome: string;
  email?: string;
  cpf?: string;
  telefone?: string;
  dataNascimento?: string;
  endereco?: string;
};

export function useStudentsModals() {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);

  const [studentToDelete, setStudentToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    nome: string;
  } | null>(null);

  const [editingStudent, setEditingStudent] = useState<EditingStudent | null>(null);

  function openEditStudent(student: StudentTableItem) {
    setEditingStudent({
      id: student.id,
      nome: student.name,
      email: student.email !== "-" ? student.email : undefined,
      telefone: student.phone !== "-" ? student.phone : undefined,
      dataNascimento: student.birthDate
        ? new Date(student.birthDate.split("/").reverse().join("-"))
            .toISOString()
            .slice(0, 10)
        : undefined,
      endereco: student.address ?? undefined,
      cpf: student.cpf ?? undefined,
    });
    setEditOpen(true);
  }

  function openDeleteStudent(student: StudentTableItem) {
    setStudentToDelete({
      id: student.id,
      name: student.name,
    });
    setDeleteOpen(true);
  }

  function openEnrollmentStudent(student: { id: string; nome: string }) {
    setSelectedStudent(student);
    setEnrollmentOpen(true);
  }

  function closeEditModal(open: boolean) {
    setEditOpen(open);
    if (!open) setEditingStudent(null);
  }

  function closeEnrollmentModal() {
    setEnrollmentOpen(false);
    setSelectedStudent(null);
  }

  function closeDeleteModal() {
    setDeleteOpen(false);
    setStudentToDelete(null);
  }

  return {
    editOpen,
    setEditOpen,
    deleteOpen,
    setDeleteOpen,
    enrollmentOpen,
    setEnrollmentOpen,
    studentToDelete,
    selectedStudent,
    setSelectedStudent,
    editingStudent,
    setEditingStudent,
    openEditStudent,
    openDeleteStudent,
    openEnrollmentStudent,
    closeEditModal,
    closeEnrollmentModal,
    closeDeleteModal,
  };
}