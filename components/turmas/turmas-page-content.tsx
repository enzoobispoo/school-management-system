"use client";

import { TurmasFiltersBar } from "./turmas-filters-bar";
import { TurmaCard } from "./card/turma-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";
import type { TurmaCardItem } from "@/hooks/turmas/use-turmas-page";

interface Props {
  professorId: string;
  turmas: TurmaCardItem[];
  search: string;
  setSearch: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  loading: boolean;
  error: string;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  meta: { total: number; totalPages: number };
  onTeacherChanged?: () => Promise<void> | void;
  onRefresh?: () => void;
}

export function TurmasPageContent(props: Props) {
  const {
    turmas,
    loading,
    error,
    page,
    setPage,
    meta,
    onTeacherChanged,
    onRefresh,
  } = props;

  return (
    <>
      <TurmasFiltersBar
        professorId={props.professorId}
        search={props.search}
        setSearch={props.setSearch}
        statusFilter={props.statusFilter}
        setStatusFilter={props.setStatusFilter}
        setPage={(value) => setPage(value)}
        turmas={turmas}
        onRefresh={onRefresh}
      />

      <div className="px-6 pb-6">
        {error ? (
          <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
            {error}
          </div>
        ) : loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-3xl border border-border/60 bg-card p-6">
                <div className="mb-4 space-y-2">
                  <div className="h-5 w-32 rounded bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted" />
                </div>
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="h-16 rounded-2xl bg-muted" />
                  <div className="h-16 rounded-2xl bg-muted" />
                </div>
                <div className="space-y-2 border-t border-border/50 pt-4">
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-3/4 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : turmas.length === 0 ? (
          <EmptyState
            icon={Users}
            message="Nenhuma turma encontrada"
            description="Crie uma turma para começar a matricular alunos."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {turmas.map((turma) => (
              <TurmaCard
                key={turma.id}
                turma={turma}
                onTeacherChanged={onTeacherChanged}
              />
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando {turmas.length} de {meta.total}
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              Anterior
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Próximo
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}