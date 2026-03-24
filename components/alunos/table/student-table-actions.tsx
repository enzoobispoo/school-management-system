"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Student {
  id: string;
  name: string;
}

interface StudentTableActionsProps<T extends Student> {
  student: T;
  onToggleDetails: () => void;
  onEnroll?: (student: { id: string; nome: string }) => void;
  onEdit?: (student: T) => void;
  onDelete?: (student: T) => void;
  onViewDetails?: (student: T) => void;
}

export function StudentTableActions<T extends Student>({
  student,
  onToggleDetails,
  onEnroll,
  onEdit,
  onDelete,
  onViewDetails,
}: StudentTableActionsProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onToggleDetails();
            onViewDetails?.(student);
          }}
        >
          Ver detalhes
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(student);
          }}
        >
          Editar
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onEnroll?.({ id: student.id, nome: student.name });
          }}
        >
          Matricular em turma
        </DropdownMenuItem>

        <DropdownMenuItem>Registrar pagamento</DropdownMenuItem>

        <DropdownMenuItem
          className="text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(student);
          }}
        >
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}