"use client";

import { TurmasFiltersBar } from "./turmas-filters-bar";
import { TurmaCard } from "./card/turma-card";
import { Button } from "@/components/ui/button";
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
  meta: {
    total: number;
    totalPages: number;
  };
  onTeacherChanged?: () => Promise<void> | void;
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
      />

      <div className="px-6 pb-6">
        {error ? (
          <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
            {error}
          </div>
        ) : loading ? (
          <div className="rounded-3xl border border-border/60 bg-card p-10 text-sm text-muted-foreground">
            Carregando turmas...
          </div>
        ) : turmas.length === 0 ? (
          <div className="rounded-3xl border border-border/60 bg-card p-10 text-sm text-muted-foreground">
            Nenhuma turma encontrada.
          </div>
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