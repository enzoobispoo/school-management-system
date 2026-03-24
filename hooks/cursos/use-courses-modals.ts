"use client";

import { useState } from "react";
import type { CourseCardItem } from "@/hooks/cursos/use-courses-query";

export function useCoursesModals() {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [editingCourse, setEditingCourse] = useState<CourseCardItem | null>(
    null
  );
  const [courseToDelete, setCourseToDelete] = useState<CourseCardItem | null>(
    null
  );

  function openEditCourse(course: CourseCardItem) {
    setEditingCourse(course);
    setEditOpen(true);
  }

  function openDeleteCourse(course: CourseCardItem) {
    setCourseToDelete(course);
    setDeleteOpen(true);
  }

  function closeEditModal(open: boolean) {
    setEditOpen(open);
    if (!open) setEditingCourse(null);
  }

  function closeDeleteModal() {
    setDeleteOpen(false);
    setCourseToDelete(null);
  }

  return {
    editOpen,
    setEditOpen,
    deleteOpen,
    setDeleteOpen,
    editingCourse,
    setEditingCourse,
    courseToDelete,
    setCourseToDelete,
    openEditCourse,
    openDeleteCourse,
    closeEditModal,
    closeDeleteModal,
  };
}