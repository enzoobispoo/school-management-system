"use client";

import { Fragment } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StudentPaymentBadge } from "@/components/alunos/table/student-payment-badge";
import { StudentExpandedRow } from "@/components/alunos/table/student-expanded-row";
import { StudentTableActions } from "@/components/alunos/table/student-table-actions";
import type { StudentTableItem } from "@/hooks/alunos/use-students-query";

interface StudentTableRowProps {
  student: StudentTableItem;
  expanded: boolean;
  onToggle: () => void;
  onEnroll?: (student: { id: string; nome: string }) => void;
  onEdit?: (student: StudentTableItem) => void;
  onDelete?: (student: StudentTableItem) => void;
  onViewDetails?: (student: StudentTableItem) => void;
}

export function StudentTableRow({
  student,
  expanded,
  onToggle,
  onEnroll,
  onEdit,
  onDelete,
  onViewDetails,
}: StudentTableRowProps) {
  return (
    <Fragment>
      <TableRow
        className={cn(
          "cursor-pointer border-border/50 transition-colors",
          expanded && "bg-muted/30"
        )}
        onClick={onToggle}
      >
        <TableCell className="py-3">
          <Button variant="ghost" size="icon" className="h-6 w-6">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </TableCell>

        <TableCell className="py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-black/[0.04] text-xs font-medium text-black">
                {student.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">{student.name}</span>
          </div>
        </TableCell>

        <TableCell className="py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-foreground">{student.email}</span>
            <span className="text-xs text-muted-foreground">
              {student.phone}
            </span>
          </div>
        </TableCell>

        <TableCell className="py-3">
          <div className="flex flex-wrap gap-1">
            {student.courses.length > 0 ? (
              student.courses.map((course) => (
                <span
                  key={course}
                  className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
                >
                  {course}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                Sem matrícula
              </span>
            )}
          </div>
        </TableCell>

        <TableCell className="py-3">
          <StudentPaymentBadge status={student.paymentStatus} />
        </TableCell>

        <TableCell className="py-3 text-muted-foreground">
          {student.enrollmentDate}
        </TableCell>

        <TableCell className="py-3">
          <StudentTableActions
            student={student}
            onToggleDetails={onToggle}
            onEnroll={onEnroll}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewDetails={onViewDetails}
          />
        </TableCell>
      </TableRow>

      {expanded ? <StudentExpandedRow student={student} /> : null}
    </Fragment>
  );
}
