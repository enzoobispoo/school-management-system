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
import { CourseForm } from "@/components/cursos/course/course-form";
import { useCourseModal } from "@/hooks/cursos/use-course-modal";

interface CourseModalProps {
  onSubmit: (payload: {
    nome: string;
    categoria: string;
    descricao?: string;
    duracaoTexto?: string;
    valorMensal: number;
    ativo?: boolean;
  }) => Promise<void>;
  loading?: boolean;
  mode?: "create" | "edit";
  initialData?: {
    nome?: string;
    categoria?: string;
    descricao?: string;
    duracaoTexto?: string;
    valorMensal?: number;
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

export function CourseModal({
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
}: CourseModalProps) {
  const {
    currentOpen,
    setCurrentOpen,
    form,
    error,
    updateField,
    closeModal,
    handleSubmit,
  } = useCourseModal({
    open,
    onOpenChange,
    initialData,
    onSubmit,
  });

  const modalTitle =
    title ?? (mode === "edit" ? "Editar Curso" : "Criar Novo Curso");

  const modalDescription =
    description ??
    (mode === "edit"
      ? "Atualize os dados do curso."
      : "Preencha os dados para criar um novo curso.");

  const modalSubmitLabel =
    submitLabel ?? (mode === "edit" ? "Salvar Alterações" : "Criar Curso");

  const defaultTriggerLabel =
    triggerLabel ?? (mode === "edit" ? "Editar" : "Novo Curso");

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

        <CourseForm
          form={form}
          error={error}
          loading={loading}
          mode={mode}
          submitLabel={modalSubmitLabel}
          updateField={updateField}
          onCancel={closeModal}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
