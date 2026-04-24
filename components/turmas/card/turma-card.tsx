"use client";

import { useState } from "react";
import { Calendar, UserCircle } from "lucide-react";
import { ChangeTeacherButton } from "../change-teacher/change-teacher-button";
import { ChangeTeacherHistoryModal } from "../history/change-teacher-history-modal";
import type { TurmaCardItem } from "@/hooks/turmas/use-turmas-page";

interface Props {
  turma: TurmaCardItem;
  onTeacherChanged?: () => Promise<void> | void;
}

export function TurmaCard({ turma, onTeacherChanged }: Props) {
  const [openHistory, setOpenHistory] = useState(false);

  return (
    <>
      <div className="group rounded-3xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-semibold text-foreground">
                {turma.name}
              </h3>

              <span
                className={
                  turma.active
                    ? "rounded-full border border-border/60 px-2.5 py-1 text-xs text-foreground"
                    : "rounded-full border border-destructive/20 bg-destructive/5 px-2.5 py-1 text-xs text-destructive"
                }
              >
                {turma.active ? "Ativa" : "Inativa"}
              </span>
            </div>

            <p className="truncate text-sm text-muted-foreground">
              {turma.courseName}
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            {turma.courseCategory}
          </span>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-muted/30 p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Alunos
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {turma.occupied}/{turma.capacity}
            </p>
          </div>

          <div className="rounded-2xl bg-muted/30 p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Vagas
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {turma.available}
            </p>
          </div>
        </div>

        <div className="space-y-4 border-t border-border/50 pt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-muted/40">
                <UserCircle className="h-4 w-4" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Professor</p>
                <p className="text-sm font-medium text-foreground">
                  {turma.teacherName || "Sem professor"}
                </p>

                <button
                  type="button"
                  onClick={() => setOpenHistory(true)}
                  className="mt-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  Ver histórico
                </button>
              </div>
            </div>

            <ChangeTeacherButton
              turmaId={turma.id}
              turmaNome={turma.name}
              currentTeacherId={turma.teacherId ?? ""}
              currentTeacherName={turma.teacherName ?? "Sem professor"}
              onSuccess={onTeacherChanged}
            />
          </div>

          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-muted/40">
              <Calendar className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Horários</p>
              <p className="text-sm text-foreground">{turma.scheduleText}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-border/50 pt-5">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Alunos matriculados
          </p>

          {turma.students.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {turma.students.slice(0, 3).map((student) => (
                <span
                  key={student.id}
                  className="rounded-full bg-muted/40 px-3 py-1.5 text-xs text-foreground"
                >
                  {student.nome}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum aluno matriculado.
            </p>
          )}
        </div>
      </div>

      <ChangeTeacherHistoryModal
        turmaId={turma.id}
        turmaNome={turma.name}
        open={openHistory}
        onOpenChange={setOpenHistory}
      />
    </>
  );
}