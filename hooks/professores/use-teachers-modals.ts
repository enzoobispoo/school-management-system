"use client";

import { useState } from "react";
import type { TeacherCardItem } from "@/hooks/professores/use-teachers-query";

export function useTeachersModals() {
  const [editOpen, setEditOpen] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);

  const [editingTeacher, setEditingTeacher] = useState<TeacherCardItem | null>(
    null
  );
  const [teacherToToggle, setTeacherToToggle] =
    useState<TeacherCardItem | null>(null);

  function openEditTeacher(teacher: TeacherCardItem) {
    setEditingTeacher(teacher);
    setEditOpen(true);
  }

  function openToggleTeacher(teacher: TeacherCardItem) {
    setTeacherToToggle(teacher);
    setToggleOpen(true);
  }

  function closeEditModal(open: boolean) {
    setEditOpen(open);
    if (!open) setEditingTeacher(null);
  }

  function closeToggleModal() {
    setToggleOpen(false);
    setTeacherToToggle(null);
  }

  return {
    editOpen,
    setEditOpen,
    toggleOpen,
    setToggleOpen,
    editingTeacher,
    setEditingTeacher,
    teacherToToggle,
    setTeacherToToggle,
    openEditTeacher,
    openToggleTeacher,
    closeEditModal,
    closeToggleModal,
  };
}