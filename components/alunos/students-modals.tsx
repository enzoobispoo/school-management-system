"use client";

import { StudentModal } from "@/components/alunos/student-modal";
import { EnrollmentModal } from "@/components/alunos/enrollment-modal";
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

interface StudentsModalsProps {
  editOpen: boolean;
  setEditOpen: (open: boolean) => void;
  deleteOpen: boolean;
  setDeleteOpen: (open: boolean) => void;
  enrollmentOpen: boolean;
  setEnrollmentOpen: (open: boolean) => void;
  submitting: boolean;
  editingStudent: {
    id: string;
    nome: string;
    email?: string;
    cpf?: string;
    telefone?: string;
    dataNascimento?: string;
    endereco?: string;
  } | null;
  setEditingStudent: (
    value: {
      id: string;
      nome: string;
      email?: string;
      cpf?: string;
      telefone?: string;
      dataNascimento?: string;
      endereco?: string;
    } | null
  ) => void;
  studentToDelete: {
    id: string;
    name: string;
  } | null;
  selectedStudent: {
    id: string;
    nome: string;
  } | null;
  setSelectedStudent: (value: { id: string; nome: string } | null) => void;
  onSubmitEdit: (payload: {
    nome: string;
    email?: string;
    cpf?: string;
    telefone?: string;
    dataNascimento?: string;
    endereco?: string;
  }) => Promise<void>;
  onConfirmDelete: () => Promise<void>;
  onEnrollmentSuccess: () => Promise<void>;
}

export function StudentsModals({
  editOpen,
  setEditOpen,
  deleteOpen,
  setDeleteOpen,
  enrollmentOpen,
  setEnrollmentOpen,
  submitting,
  editingStudent,
  setEditingStudent,
  studentToDelete,
  selectedStudent,
  setSelectedStudent,
  onSubmitEdit,
  onConfirmDelete,
  onEnrollmentSuccess,
}: StudentsModalsProps) {
  return (
    <>
      <StudentModal
        key={editingStudent?.id ?? "edit-student"}
        mode="edit"
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingStudent(null);
        }}
        hideTrigger
        initialData={
          editingStudent
            ? {
                nome: editingStudent.nome,
                email: editingStudent.email,
                cpf: editingStudent.cpf,
                telefone: editingStudent.telefone,
                dataNascimento: editingStudent.dataNascimento,
                endereco: editingStudent.endereco,
              }
            : null
        }
        title="Editar Aluno"
        description="Atualize os dados do aluno."
        submitLabel="Salvar Alterações"
        loading={submitting}
        onSubmit={onSubmitEdit}
      />

      <EnrollmentModal
        open={enrollmentOpen}
        onClose={() => {
          setEnrollmentOpen(false);
          setSelectedStudent(null);
        }}
        aluno={selectedStudent}
        onSuccess={onEnrollmentSuccess}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aluno</AlertDialogTitle>
            <AlertDialogDescription>
              {studentToDelete
                ? `Tem certeza que deseja excluir ${studentToDelete.name}? Essa ação não poderá ser desfeita.`
                : "Tem certeza que deseja excluir este aluno?"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteOpen(false)}
            >
              Cancelar
            </AlertDialogCancel>

            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault();
                await onConfirmDelete();
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}