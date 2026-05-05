"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Download, Users } from "lucide-react";
import { TeacherCard } from "@/components/professores/teacher-card";
import { TeacherModal } from "@/components/professores/teacher-modal";
import { DashboardSectionCard } from "@/components/dashboard/ui/dashboard-section-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export/export-to-csv";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TeacherCardItem } from "@/hooks/professores/use-teachers-query";

interface TeachersPageContentProps {
  teachers: TeacherCardItem[];
  search: string;
  setSearch: (value: string) => void;
  courseFilter: string;
  setCourseFilter: (value: string) => void;
  loading: boolean;
  error: string;
  submitting: boolean;
  onCreateTeacher: (payload: {
    nome: string;
    email?: string;
    telefone?: string;
    ativo?: boolean;
  }) => Promise<void>;
  onEdit: (teacher: TeacherCardItem) => void;
  onDelete: (teacher: TeacherCardItem) => void;
}

export function TeachersPageContent({
  teachers,
  search,
  setSearch,
  courseFilter,
  setCourseFilter,
  loading,
  error,
  submitting,
  onCreateTeacher,
  onEdit,
  onDelete,
}: TeachersPageContentProps) {
  const router = useRouter();
  const [cursos, setCursos] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    fetch("/api/cursos?pageSize=100", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.data)) setCursos(d.data); })
      .catch(() => {});
  }, []);

  return (
    <div className="p-6">
      <DashboardSectionCard className="mb-6 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar professor..."
                className="h-11 rounded-2xl bg-background pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="h-11 w-[180px] rounded-2xl">
                <SelectValue placeholder="Curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {cursos.map((c) => (
                  <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-2xl"
              title="Exportar CSV"
              onClick={() => exportToCSV(
                teachers.map((t) => ({
                  Nome: t.name,
                  Email: t.email,
                  Telefone: t.phone,
                  Cursos: t.courses.join(" | "),
                  Status: t.active ? "Ativo" : "Inativo",
                })),
                "professores.csv"
              )}
            >
              <Download className="h-4 w-4" />
            </Button>
            <TeacherModal onSubmit={onCreateTeacher} loading={submitting} />
          </div>
        </div>
      </DashboardSectionCard>

      {error ? (
        <div className="rounded-[24px] border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-[28px] border border-border/50 bg-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-3/4 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : teachers.length === 0 ? (
        <EmptyState
          icon={Users}
          message="Nenhum professor encontrado"
          description="Cadastre um professor para vinculá-lo às turmas."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teachers.map((teacher) => (
            <TeacherCard
              key={teacher.id}
              teacher={teacher}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={(selectedTeacher) => {
                router.push(`/professores/${selectedTeacher.id}`);
              }}
              onManageClasses={(selectedTeacher) => {
                router.push(`/turmas?professorId=${selectedTeacher.id}`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}