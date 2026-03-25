"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, Search, UserCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TurmaCardItem } from "@/hooks/turmas/use-turmas-page";

interface TurmasPageContentProps {
  professorId: string;
  turmas: TurmaCardItem[];
  search: string;
  setSearch: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  loading: boolean;
  error: string;
  page: number;
  setPage: (value: number | ((prev: number) => number)) => void;
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function TurmasPageContent({
  professorId,
  turmas,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  loading,
  error,
  page,
  setPage,
  meta,
}: TurmasPageContentProps) {
  return (
    <>
      {professorId ? (
        <div className="px-6 pt-4">
          <Link
            href="/professores"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para professores
          </Link>
        </div>
      ) : null}

      <div className="p-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar turma, curso ou professor..."
                className="bg-background pl-9"
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setPage(1);
                setStatusFilter(value);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

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
              <div
                key={turma.id}
                className="group rounded-3xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
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
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-muted/40">
                      <UserCircle className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Professor</p>
                      <p className="truncate text-sm font-medium text-foreground">
                        {turma.teacherName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-muted/40">
                      <Calendar className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Horários</p>
                      <p className="leading-5 text-sm text-foreground">
                        {turma.scheduleText}
                      </p>
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

                      {turma.students.length > 3 ? (
                        <span className="rounded-full bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground">
                          +{turma.students.length - 3}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhum aluno matriculado.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando {turmas.length} de {meta.total} turmas
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              Anterior
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages || loading}
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