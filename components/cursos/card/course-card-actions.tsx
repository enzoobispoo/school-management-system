"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Course {
  id: string;
  name: string;
  active: boolean;
}

interface CourseCardActionsProps<T extends Course> {
  course: T;
  onEdit?: (course: T) => void;
  onDelete?: (course: T) => void;
  onViewStudents?: (course: T) => void;
  onAddClass: () => void;
}

export function CourseCardActions<T extends Course>({
  course,
  onEdit,
  onDelete,
  onViewStudents,
  onAddClass,
}: CourseCardActionsProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={!course.active}
          onClick={() => onEdit?.(course)}
        >
          Editar curso
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onViewStudents?.(course)}>
          Ver alunos
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={!course.active}
          onClick={onAddClass}
        >
          Adicionar turma
        </DropdownMenuItem>

        <DropdownMenuItem
          className={course.active ? "text-destructive" : "text-foreground"}
          onClick={() => onDelete?.(course)}
        >
          {course.active ? "Desativar" : "Ativar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}