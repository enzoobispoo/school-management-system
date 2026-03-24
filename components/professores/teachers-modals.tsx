"use client";

import { TeacherModal } from "@/components/professores/teacher-modal";
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
import type { TeacherCardItem } from "@/hooks/professores/use-teachers-query";

interface TeachersModalsProps {
  editOpen: boolean;
  onEditOpenChange: (open: boolean) => void;
  toggleOpen: boolean;
  onToggleOpenChange: (open: boolean) => void;
  editingTeacher: TeacherCardItem | null;
  teacherToToggle: TeacherCardItem | null;
  submitting: boolean;
  onSubmitEdit: (payload: {
    nome: string;
    email?: string;
    telefone?: string;
    ativo?: boolean;
  }) => Promise<void>;
  onConfirmToggleStatus: () => Promise<void>;
}

export function TeachersModals({
  editOpen,
  onEditOpenChange,
  toggleOpen,
  onToggleOpenChange,
  editingTeacher,
  teacherToToggle,
  submitting,
  onSubmitEdit,
  onConfirmToggleStatus,
}: TeachersModalsProps) {
  return (
    <>
      <TeacherModal
        mode="edit"
        open={editOpen}
        onOpenChange={onEditOpenChange}
        hideTrigger
        initialData={
          editingTeacher
            ? {
                nome: editingTeacher.name,
                email: editingTeacher.email !== "-" ? editingTeacher.email : "",
                telefone:
                  editingTeacher.phone !== "-" ? editingTeacher.phone : "",
                ativo: editingTeacher.active,
              }
            : null
        }
        title="Editar Professor"
        description="Atualize os dados do professor."
        submitLabel="Salvar Alterações"
        loading={submitting}
        onSubmit={onSubmitEdit}
      />

      <AlertDialog open={toggleOpen} onOpenChange={onToggleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {teacherToToggle?.active
                ? "Desativar professor"
                : "Ativar professor"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {teacherToToggle
                ? teacherToToggle.active
                  ? `Tem certeza que deseja desativar o professor ${teacherToToggle.name}?`
                  : `Tem certeza que deseja ativar o professor ${teacherToToggle.name}?`
                : "Tem certeza que deseja alterar este professor?"}
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
              {teacherToToggle?.active ? "Desativar" : "Ativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}