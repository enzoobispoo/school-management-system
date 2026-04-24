"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StudentTableRow } from "@/components/alunos/table/student-table-row";
import type { StudentTableItem } from "@/hooks/alunos/use-students-query";

interface StudentsTableProps {
  students: StudentTableItem[];
  loading?: boolean;
  onEnroll?: (student: { id: string; nome: string }) => void;
  onEdit?: (student: StudentTableItem) => void;
  onDelete?: (student: StudentTableItem) => void;
  onViewDetails?: (student: StudentTableItem) => void;
}

export function StudentsTable({
  students,
  loading = false,
  onEnroll,
  onEdit,
  onDelete,
  onViewDetails,
}: StudentsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  function toggleRow(id: string) {
    setExpandedRow((prev) => (prev === id ? null : id));
  }

  if (loading) {
    return (
      <div className="rounded-[24px] border border-border/50 bg-card p-8 text-sm text-muted-foreground transition-all duration-200 data-[density=compact]:p-6">
        Carregando alunos...
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="rounded-[24px] border border-border/50 bg-card p-8 text-sm text-muted-foreground transition-all duration-200 data-[density=compact]:p-6">
        Nenhum aluno encontrado.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-border/50 bg-card">
      <div className="overflow-x-auto">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-10"></TableHead>
              <TableHead className="font-medium">Aluno</TableHead>
              <TableHead className="font-medium">Contato</TableHead>
              <TableHead className="font-medium">Curso(s)</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="font-medium">Matrícula</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {students.map((student) => (
              <StudentTableRow
                key={student.id}
                student={student}
                expanded={expandedRow === student.id}
                onToggle={() => toggleRow(student.id)}
                onEnroll={onEnroll}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewDetails={onViewDetails}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}