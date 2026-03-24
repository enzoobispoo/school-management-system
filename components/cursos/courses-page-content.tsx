"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { CourseCard } from "@/components/cursos/course-card";
import { CourseModal } from "@/components/cursos/course-modal";
import { DashboardSectionCard } from "@/components/dashboard/ui/dashboard-section-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CourseCardItem } from "@/hooks/cursos/use-courses-query";

interface CoursesPageContentProps {
  courses: CourseCardItem[];
  search: string;
  setSearch: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  loading: boolean;
  error: string;
  submitting: boolean;
  onCreateCourse: (payload: {
    nome: string;
    categoria: string;
    descricao?: string;
    duracaoTexto?: string;
    valorMensal: number;
    ativo?: boolean;
  }) => Promise<void>;
  onRefresh: () => Promise<void>;
  onEdit: (course: CourseCardItem) => void;
  onDelete: (course: CourseCardItem) => void;
}

export function CoursesPageContent({
  courses,
  search,
  setSearch,
  category,
  setCategory,
  loading,
  error,
  submitting,
  onCreateCourse,
  onRefresh,
  onEdit,
  onDelete,
}: CoursesPageContentProps) {
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
                placeholder="Buscar curso..."
                className="h-11 rounded-2xl bg-background pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11 w-[180px] rounded-2xl">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="idiomas">Idiomas</SelectItem>
                <SelectItem value="musica">Música</SelectItem>
                <SelectItem value="tecnologia">Tecnologia</SelectItem>
                <SelectItem value="educacao">Educação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <CourseModal onSubmit={onCreateCourse} loading={submitting} />
        </div>
      </DashboardSectionCard>

      {error ? (
        <div className="rounded-[24px] border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : loading ? (
        <div className="rounded-[24px] border border-border/50 bg-card p-8 text-sm text-muted-foreground">
          Carregando cursos...
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-[24px] border border-border/50 bg-card p-8 text-sm text-muted-foreground">
          Nenhum curso encontrado.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onRefresh={onRefresh}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewStudents={(selectedCourse) => {
                router.push(`/alunos?courseId=${selectedCourse.id}`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}