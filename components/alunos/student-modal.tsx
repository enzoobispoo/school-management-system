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
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  loading?: boolean;
  mode?: "create" | "edit";
  initialData?: Partial<import("@/hooks/alunos/use-student-modal").StudentFormData> | null;
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
    errorField,
    errorTab,
    updateField,
    updateBoolField,
    closeModal,
    handleSubmit,
    formatCpf,
    formatPhone,
    guardClose,
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
        if (!next) closeModal();
        else setCurrentOpen(true);
      }}
    >
      {!hideTrigger ? (
        <DialogTrigger asChild>
          {mode === "create" ? (
            <Button className="gap-2 rounded-2xl h-11 px-5 bg-black text-white dark:bg-white/10 dark:text-white dark:backdrop-blur-md dark:hover:bg-white/20 border border-black/10 dark:border-white/10 shadow-sm">
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
          updateBoolField={updateBoolField}
          formatCpf={formatCpf}
          formatPhone={formatPhone}
          onCancel={closeModal}
          onSubmit={handleSubmit}
          errorField={errorField}
          errorTab={errorTab}
        />
      </DialogContent>
    </Dialog>
  );
}