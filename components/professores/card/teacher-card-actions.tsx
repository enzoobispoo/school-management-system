"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Teacher {
  id: string;
  active: boolean;
}

interface TeacherCardActionsProps<T extends Teacher> {
  teacher: T;
  onEdit?: (teacher: T) => void;
  onDelete?: (teacher: T) => void;
  onView?: (teacher: T) => void;
  onManageClasses?: (teacher: T) => void;
}

export function TeacherCardActions<T extends Teacher>({
  teacher,
  onEdit,
  onDelete,
  onView,
  onManageClasses,
}: TeacherCardActionsProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView?.(teacher)}>
          Ver perfil
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={!teacher.active}
          onClick={() => onEdit?.(teacher)}
        >
          Editar
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={!teacher.active}
          onClick={() => onManageClasses?.(teacher)}
        >
          Gerenciar turmas
        </DropdownMenuItem>

        <DropdownMenuItem
          className={teacher.active ? "text-destructive" : "text-foreground"}
          onClick={() => onDelete?.(teacher)}
        >
          {teacher.active ? "Desativar" : "Ativar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}