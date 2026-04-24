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
import { TeacherForm } from "@/components/professores/teacher/teacher-form";
import { useTeacherModal } from "@/hooks/professores/use-teacher-modal";

interface TeacherModalProps {
  onSubmit: (payload: {
    nome: string;
    email?: string;
    telefone?: string;
    ativo?: boolean;
  }) => Promise<void>;
  loading?: boolean;
  mode?: "create" | "edit";
  initialData?: {
    nome?: string;
    email?: string;
    telefone?: string;
    ativo?: boolean;
  } | null;
  triggerLabel?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function TeacherModal({
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
}: TeacherModalProps) {
  const {
    currentOpen,
    setCurrentOpen,
    form,
    error,
    updateField,
    closeModal,
    handleSubmit,
    formatPhone,
  } = useTeacherModal({
    open,
    onOpenChange,
    initialData,
    onSubmit,
  });

  const modalTitle =
    title ?? (mode === "edit" ? "Editar Professor" : "Cadastrar Professor");

  const modalDescription =
    description ??
    (mode === "edit"
      ? "Atualize os dados do professor."
      : "Preencha os dados do professor.");

  const modalSubmitLabel =
    submitLabel ??
    (mode === "edit" ? "Salvar Alterações" : "Cadastrar Professor");

  const defaultTriggerLabel =
    triggerLabel ?? (mode === "edit" ? "Editar" : "Novo Professor");

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

        <TeacherForm
          form={form}
          error={error}
          loading={loading}
          mode={mode}
          submitLabel={modalSubmitLabel}
          updateField={updateField}
          formatPhone={formatPhone}
          onCancel={closeModal}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}