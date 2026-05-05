"use client";

import Link from "next/link";
import { ArrowLeft, Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export/export-to-csv";
import { TurmaModalStandalone } from "@/components/turmas/turma-modal-standalone";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TurmaCardItem } from "@/hooks/turmas/use-turmas-page";

interface Props {
  professorId: string;
  search: string;
  setSearch: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  setPage: (value: number) => void;
  turmas?: TurmaCardItem[];
  onRefresh?: () => void;
}

export function TurmasFiltersBar({
  professorId,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  setPage,
  turmas = [],
  onRefresh,
}: Props) {
  return (
    <>
      {professorId && (
        <div className="px-6 pt-4">
          <Link href="/professores" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar para professores
          </Link>
        </div>
      )}

      <div className="p-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar turma, curso ou professor..."
                className="pl-9"
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => { setPage(1); setStatusFilter(value); }}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="icon" className="h-11 w-11 rounded-2xl" title="Exportar CSV"
              onClick={() => exportToCSV(
                turmas.map((t) => ({
                  Turma: t.name,
                  Curso: t.courseName,
                  Professor: t.teacherName ?? "",
                  Alunos: t.occupied,
                  Capacidade: t.capacity,
                  Status: t.active ? "Ativa" : "Inativa",
                })),
                "turmas.csv"
              )}
            >
              <Download className="h-4 w-4" />
            </Button>
            {!professorId && <TurmaModalStandalone onSuccess={onRefresh} />}
          </div>
        </div>
      </div>
    </>
  );
}