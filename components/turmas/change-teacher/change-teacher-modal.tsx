"use client";

import { useEffect } from "react";
import { GraduationCap, UserCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChangeTeacherForm } from "./change-teacher-form";
import { useChangeTeacher } from "../../../hooks/turmas/use-change-teacher";

interface ChangeTeacherModalProps {
  turmaId: string;
  currentTeacherId: string;
  currentTeacherName: string;
  turmaNome: string;
  onSuccess?: () => Promise<void> | void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeTeacherModal({
  turmaId,
  currentTeacherId,
  currentTeacherName,
  turmaNome,
  onSuccess,
  open,
  onOpenChange,
}: ChangeTeacherModalProps) {
  const {
    teachers,
    teacherId,
    setTeacherId,
    motivoTroca,
    setMotivoTroca,
    observacoes,
    setObservacoes,
    dataInicio,
    setDataInicio,
    loadingTeachers,
    saving,
    error,
    handleOpenChange,
    handleSubmit,
  } = useChangeTeacher({
    turmaId,
    currentTeacherId,
    onSuccess,
    onClose: () => onOpenChange(false),
  });

  useEffect(() => {
    if (!open) return;
    handleOpenChange(true);
  }, [open, handleOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] rounded-[28px] border border-black/5 bg-white text-black shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white">
        <DialogHeader>
          <DialogTitle className="text-black dark:text-white">
            Trocar professor
          </DialogTitle>
          <DialogDescription className="text-black/42 dark:text-white/60">
            Atualize o professor responsável pela turma{" "}
            <strong>{turmaNome}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Turma</p>
              <p className="text-sm font-medium text-foreground">{turmaNome}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background">
              <UserCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Professor atual</p>
              <p className="text-sm font-medium text-foreground">
                {currentTeacherName || "Sem professor"}
              </p>
            </div>
          </div>
        </div>

        <ChangeTeacherForm
          teachers={teachers}
          teacherId={teacherId}
          setTeacherId={setTeacherId}
          motivoTroca={motivoTroca}
          setMotivoTroca={setMotivoTroca}
          observacoes={observacoes}
          setObservacoes={setObservacoes}
          dataInicio={dataInicio}
          setDataInicio={setDataInicio}
          loadingTeachers={loadingTeachers}
          saving={saving}
          error={error}
          onCancel={() => onOpenChange(false)}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}