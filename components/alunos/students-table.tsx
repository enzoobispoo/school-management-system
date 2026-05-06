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
import { EmptyState } from "@/components/shared/empty-state";
import { GraduationCap, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import type { StudentTableItem } from "@/hooks/alunos/use-students-query";

type SortKey =
  | "name"
  | "enrollmentDate"
  | "paymentStatus"
  | "situacaoRisco"
  | "media"
  | "faltas";
type SortDir = "asc" | "desc";

function situacaoRiscoRank(student: StudentTableItem): number {
  const r = student.situacaoResumo?.risco;
  if (!student.situacaoResumo || !r) return 2;
  return r === "atencao" ? 0 : 1;
}

function compareMedia(a: StudentTableItem, b: StudentTableItem): number {
  const ma = a.situacaoResumo?.mediaGeral;
  const mb = b.situacaoResumo?.mediaGeral;
  const na = ma == null || Number.isNaN(ma);
  const nb = mb == null || Number.isNaN(mb);
  if (na && nb) return 0;
  if (na) return 1;
  if (nb) return -1;
  return ma - mb;
}

function compareFaltas(a: StudentTableItem, b: StudentTableItem): number {
  const fa = a.situacaoResumo?.faltas ?? 0;
  const fb = b.situacaoResumo?.faltas ?? 0;
  return fa - fb;
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
  return sortDir === "asc"
    ? <ChevronUp className="ml-1 inline h-3 w-3" />
    : <ChevronDown className="ml-1 inline h-3 w-3" />;
}

interface StudentsTableProps {
  students: StudentTableItem[];
  loading?: boolean;
  onEnroll?: (student: { id: string; nome: string }) => void;
  onEdit?: (student: StudentTableItem) => void;
  onDelete?: (student: StudentTableItem) => void;
  onViewDetails?: (student: StudentTableItem) => void;
  onRefresh?: () => void;
}

export function StudentsTable({
  students,
  loading = false,
  onEnroll,
  onEdit,
  onDelete,
  onViewDetails,
  onRefresh,
}: StudentsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function toggleRow(id: string) {
    setExpandedRow((prev) => (prev === id ? null : id));
  }

  const statusOrder = { overdue: 0, pending: 1, paid: 2 };
  const sorted = [...students].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name") cmp = a.name.localeCompare(b.name);
    else if (sortKey === "enrollmentDate") cmp = a.enrollmentDate.localeCompare(b.enrollmentDate);
    else if (sortKey === "paymentStatus") cmp = (statusOrder[a.paymentStatus] ?? 1) - (statusOrder[b.paymentStatus] ?? 1);
    else if (sortKey === "situacaoRisco") cmp = situacaoRiscoRank(a) - situacaoRiscoRank(b);
    else if (sortKey === "media") cmp = compareMedia(a, b);
    else if (sortKey === "faltas") cmp = compareFaltas(a, b);
    return sortDir === "asc" ? cmp : -cmp;
  });

  if (loading) {
    return (
      <div className="rounded-[24px] border border-border/50 bg-card p-8 text-sm text-muted-foreground transition-all duration-200 data-[density=compact]:p-6">
        Carregando alunos...
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        message="Nenhum aluno encontrado"
        description="Cadastre um aluno ou ajuste os filtros de busca."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-border/50 bg-card">
      <div className="overflow-x-auto">
        <Table className="min-w-[920px]">
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-10"></TableHead>
              <TableHead
                className="cursor-pointer select-none font-medium hover:text-foreground"
                onClick={() => toggleSort("name")}
              >
                Aluno <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
              </TableHead>
              <TableHead className="font-medium">Contato</TableHead>
              <TableHead className="font-medium">Curso(s)</TableHead>
              <TableHead
                className="cursor-pointer select-none font-medium hover:text-foreground"
                onClick={() => toggleSort("paymentStatus")}
              >
                Status <SortIcon col="paymentStatus" sortKey={sortKey} sortDir={sortDir} />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none font-medium hover:text-foreground"
                onClick={() => toggleSort("situacaoRisco")}
              >
                Situação{" "}
                <SortIcon col="situacaoRisco" sortKey={sortKey} sortDir={sortDir} />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none font-medium hover:text-foreground"
                onClick={() => toggleSort("media")}
              >
                Média{" "}
                <SortIcon col="media" sortKey={sortKey} sortDir={sortDir} />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none font-medium hover:text-foreground"
                onClick={() => toggleSort("faltas")}
              >
                Faltas{" "}
                <SortIcon col="faltas" sortKey={sortKey} sortDir={sortDir} />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none font-medium hover:text-foreground"
                onClick={() => toggleSort("enrollmentDate")}
              >
                Matrícula <SortIcon col="enrollmentDate" sortKey={sortKey} sortDir={sortDir} />
              </TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sorted.map((student) => (
              <StudentTableRow
                key={student.id}
                student={student}
                expanded={expandedRow === student.id}
                onToggle={() => toggleRow(student.id)}
                onEnroll={onEnroll}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewDetails={onViewDetails}
                onRefresh={onRefresh}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}