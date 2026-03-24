"use client";

import { Mail, Phone } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StudentCpfField } from "@/components/alunos/table/student-cpf-field";
import { StudentFinancialHistory } from "@/components/alunos/table/student-financial-history";

interface StudentExpandedRowProps {
  student: {
    email: string;
    phone: string;
    cpf?: string;
    birthDate?: string;
    address?: string;
    courses: string[];
    financialHistory?: {
      id?: string;
      date: string;
      description: string;
      amount: number;
      status: "paid" | "pending" | "overdue";
    }[];
  };
}

export function StudentExpandedRow({ student }: StudentExpandedRowProps) {
  return (
    <TableRow className="border-border/50 bg-muted/20 hover:bg-transparent">
      <TableCell colSpan={7} className="p-0">
        <div className="animate-in fade-in-0 slide-in-from-top-1 border-t border-border/30 px-6 py-4 duration-200">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h4 className="mb-3 text-sm font-medium text-foreground">
                Dados Pessoais
              </h4>

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {student.email}
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {student.phone}
                </div>

                {student.cpf ? <StudentCpfField cpf={student.cpf} /> : null}

                {student.birthDate ? (
                  <div className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Nascimento:
                    </span>{" "}
                    {student.birthDate}
                  </div>
                ) : null}

                {student.address ? (
                  <div className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Endereço:
                    </span>{" "}
                    {student.address}
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-medium text-foreground">
                Matrículas
              </h4>

              <div className="flex flex-col gap-2">
                {student.courses.length > 0 ? (
                  student.courses.map((course) => (
                    <div
                      key={course}
                      className="flex items-center justify-between rounded-md border border-border/50 bg-background p-2"
                    >
                      <span className="text-sm">{course}</span>
                      <Badge variant="secondary" className="text-xs">
                        Ativo
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Nenhuma matrícula encontrada.
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-medium text-foreground">
                Histórico Financeiro
              </h4>

              <StudentFinancialHistory items={student.financialHistory} />
            </div>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}