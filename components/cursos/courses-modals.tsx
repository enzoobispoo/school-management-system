"use client";

import { CourseModal } from "@/components/cursos/course-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { CourseCardItem } from "@/hooks/cursos/use-courses-query";

interface CoursesModalsProps {
  editOpen: boolean;
  onEditOpenChange: (open: boolean) => void;
  deleteOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  editingCourse: CourseCardItem | null;
  courseToDelete: CourseCardItem | null;
  submitting: boolean;
  onSubmitEdit: (payload: {
    nome: string;
    categoria: string;
    descricao?: string;
    duracaoTexto?: string;
    valorMensal: number;
    ativo?: boolean;
  }) => Promise<void>;
  onConfirmToggleStatus: () => Promise<void>;
}

export function CoursesModals({
  editOpen,
  onEditOpenChange,
  deleteOpen,
  onDeleteOpenChange,
  editingCourse,
  courseToDelete,
  submitting,
  onSubmitEdit,
  onConfirmToggleStatus,
}: CoursesModalsProps) {
  return (
    <>
      <CourseModal
        mode="edit"
        open={editOpen}
        onOpenChange={onEditOpenChange}
        hideTrigger
        initialData={
          editingCourse
            ? {
                nome: editingCourse.name,
                categoria: editingCourse.category,
                duracaoTexto: editingCourse.duration,
                valorMensal: editingCourse.price,
              }
            : null
        }
        onSubmit={onSubmitEdit}
        loading={submitting}
      />

      <AlertDialog open={deleteOpen} onOpenChange={onDeleteOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {courseToDelete?.active ? "Desativar curso" : "Ativar curso"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {courseToDelete
                ? courseToDelete.active
                  ? `Tem certeza que deseja desativar o curso ${courseToDelete.name}?`
                  : `Tem certeza que deseja ativar o curso ${courseToDelete.name}?`
                : "Tem certeza que deseja alterar este curso?"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>

            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault();
                await onConfirmToggleStatus();
              }}
            >
              {courseToDelete?.active ? "Desativar" : "Ativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}