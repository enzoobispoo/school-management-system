"use client";

import { Search, Filter } from "lucide-react";
import { StudentsTable } from "@/components/alunos/students-table";
import { StudentModal } from "@/components/alunos/student-modal";
import { StudentsAdvancedFilters } from "@/components/alunos/students-advanced-filters";
import { DashboardSectionCard } from "@/components/dashboard/ui/dashboard-section-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StudentTableItem } from "@/hooks/alunos/use-students-query";
import type { StudentsAdvancedFiltersState } from "@/hooks/alunos/use-students-advanced-filters";

interface StudentsPageContentProps {
  students: StudentTableItem[];
  search: string;
  setSearch: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  loading: boolean;
  submitting: boolean;
  error: string;
  page: number;
  setPage: (value: number | ((prev: number) => number)) => void;
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  advancedFiltersOpen: boolean;
  setAdvancedFiltersOpen: (open: boolean) => void;
  advancedFilters: StudentsAdvancedFiltersState;
  advancedFiltersDraft: StudentsAdvancedFiltersState;
  setAdvancedFiltersDraft: (value: StudentsAdvancedFiltersState) => void;
  hasAdvancedFilters: boolean;
  applyAdvancedFilters: () => void;
  clearAdvancedFilters: () => void;
  onCreateStudent: (payload: {
    nome: string;
    email?: string;
    cpf?: string;
    telefone?: string;
    dataNascimento?: string;
    endereco?: string;
  }) => Promise<void>;
  onEnroll: (student: { id: string; nome: string }) => void;
  onEdit: (student: StudentTableItem) => void;
  onDelete: (student: StudentTableItem) => void;
}

export function StudentsPageContent({
  students,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  loading,
  submitting,
  error,
  page,
  setPage,
  meta,
  advancedFiltersOpen,
  setAdvancedFiltersOpen,
  advancedFilters,
  advancedFiltersDraft,
  setAdvancedFiltersDraft,
  hasAdvancedFilters,
  applyAdvancedFilters,
  clearAdvancedFilters,
  onCreateStudent,
  onEnroll,
  onEdit,
  onDelete,
}: StudentsPageContentProps) {
  return (
    <div className="p-6">
      <DashboardSectionCard className="mb-6 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar aluno..."
                className="h-11 rounded-2xl bg-background pl-9"
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
              <SelectTrigger className="h-11 w-[180px] rounded-2xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="paid">Em dia</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="overdue">Atrasado</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              type="button"
              className="relative h-11 w-11 rounded-2xl"
              onClick={() => setAdvancedFiltersOpen(true)}
            >
              <Filter className="h-4 w-4" />
              {hasAdvancedFilters ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-black" />
              ) : null}
            </Button>
          </div>

          <StudentModal onSubmit={onCreateStudent} loading={submitting} />
        </div>
      </DashboardSectionCard>

      {error ? (
        <div className="rounded-[24px] border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <StudentsTable
          students={students}
          loading={loading}
          onEnroll={onEnroll}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewDetails={(student) => {
            console.log("Ver detalhes:", student);
          }}
        />
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Mostrando {students.length} de {meta.total} alunos
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={page <= 1 || loading}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={page >= meta.totalPages || loading}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Próximo
          </Button>
        </div>
      </div>

      <StudentsAdvancedFilters
        open={advancedFiltersOpen}
        onOpenChange={setAdvancedFiltersOpen}
        value={advancedFilters}
        draft={advancedFiltersDraft}
        onDraftChange={setAdvancedFiltersDraft}
        onApply={applyAdvancedFilters}
        onClear={clearAdvancedFilters}
      />
    </div>
  );
}