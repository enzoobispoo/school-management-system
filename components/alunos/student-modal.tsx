"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { StudentForm } from "@/components/alunos/student/student-form";
import { useStudentModal } from "@/hooks/alunos/use-student-modal";

interface StudentModalProps {
  onSubmit: (payload: {
    nome: string;
    email?: string;
    cpf?: string;
    telefone?: string;
    dataNascimento?: string;
    endereco?: string;
  }) => Promise<void>;
  loading?: boolean;
  mode?: "create" | "edit";
  initialData?: {
    nome?: string;
    email?: string;
    cpf?: string;
    telefone?: string;
    dataNascimento?: string;
    endereco?: string;
  } | null;
  triggerLabel?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function StudentModal({
  onSubmit,
  loading = false,
  mode = "create",
  initialData = null,
  triggerLabel,
  title,
  description,
  submitLabel,
  open,
  onOpenChange,
  hideTrigger = false,
}: StudentModalProps) {
  const {
    currentOpen,
    setCurrentOpen,
    form,
    error,
    updateField,
    closeModal,
    handleSubmit,
    formatCpf,
    formatPhone,
  } = useStudentModal({
    open,
    onOpenChange,
    initialData,
    onSubmit,
  });

  const modalTitle =
    title ?? (mode === "edit" ? "Editar Aluno" : "Cadastrar Novo Aluno");

  const modalDescription =
    description ??
    (mode === "edit"
      ? "Atualize os dados do aluno."
      : "Preencha os dados do aluno para realizar o cadastro.");

  const modalSubmitLabel =
    submitLabel ?? (mode === "edit" ? "Salvar Alterações" : "Cadastrar Aluno");

  const defaultTriggerLabel =
    triggerLabel ?? (mode === "edit" ? "Editar" : "Novo Aluno");

  return (
    <Dialog
      open={currentOpen}
      onOpenChange={(next) => {
        setCurrentOpen(next);
        if (!next) closeModal();
      }}
    >
      {!hideTrigger ? (
        <DialogTrigger asChild>
          {mode === "create" ? (
            <Button className="gap-2 rounded-2xl">
              <Plus className="h-4 w-4" />
              {defaultTriggerLabel}
            </Button>
          ) : (
            <Button variant="outline" className="rounded-2xl">
              {defaultTriggerLabel}
            </Button>
          )}
        </DialogTrigger>
      ) : null}

      <DialogContent className="sm:max-w-[500px] rounded-[28px]">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription>{modalDescription}</DialogDescription>
        </DialogHeader>

        <StudentForm
          form={form}
          error={error}
          loading={loading}
          mode={mode}
          submitLabel={modalSubmitLabel}
          updateField={updateField}
          formatCpf={formatCpf}
          formatPhone={formatPhone}
          onCancel={closeModal}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}