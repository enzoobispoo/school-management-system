"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { TeacherCard } from "@/components/professores/teacher-card";
import { TeacherModal } from "@/components/professores/teacher-modal";
import { DashboardSectionCard } from "@/components/dashboard/ui/dashboard-section-card";
import { Input } from "@/components/ui/input";
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
                <SelectItem value="ingles">Inglês</SelectItem>
                <SelectItem value="espanhol">Espanhol</SelectItem>
                <SelectItem value="musica">Música</SelectItem>
                <SelectItem value="informatica">Informática</SelectItem>
                <SelectItem value="robotica">Robótica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TeacherModal onSubmit={onCreateTeacher} loading={submitting} />
        </div>
      </DashboardSectionCard>

      {error ? (
        <div className="rounded-[24px] border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : loading ? (
        <div className="rounded-[24px] border border-border/50 bg-card p-8 text-sm text-muted-foreground">
          Carregando professores...
        </div>
      ) : teachers.length === 0 ? (
        <div className="rounded-[24px] border border-border/50 bg-card p-8 text-sm text-muted-foreground">
          Nenhum professor encontrado.
        </div>
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