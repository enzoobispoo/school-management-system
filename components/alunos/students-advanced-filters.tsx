"use client";

import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { StudentsAdvancedFiltersState } from "@/hooks/alunos/use-students-advanced-filters";

interface StudentsAdvancedFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: StudentsAdvancedFiltersState;
  draft: StudentsAdvancedFiltersState;
  onDraftChange: (value: StudentsAdvancedFiltersState) => void;
  onApply: () => void;
  onClear: () => void;
}

export function StudentsAdvancedFilters({
  open,
  onOpenChange,
  value,
  draft,
  onDraftChange,
  onApply,
  onClear,
}: StudentsAdvancedFiltersProps) {
  const [turmas, setTurmas] = useState<{ id: string; nome: string; cursoNome: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/turmas?pageSize=100&ativo=true", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.data)) {
          setTurmas(d.data.map((t: any) => ({ id: t.id, nome: t.nome, cursoNome: t.curso?.nome ?? "" })));
        }
      });
  }, [open]);

  const hasActiveFilters =
    value.course.trim() !== "" ||
    value.turmaId !== "" ||
    value.enrollment !== "ALL" ||
    value.financialStatus !== "ALL" ||
    value.hasAddress !== "ALL" ||
    value.hasLaudo !== "ALL" ||
    value.hasAdaptacao !== "ALL" ||
    value.alunoStatus !== "ALL";

  function updateField<K extends keyof StudentsAdvancedFiltersState>(
    field: K,
    fieldValue: StudentsAdvancedFiltersState[K]
  ) {
    onDraftChange({ ...draft, [field]: fieldValue });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] rounded-[28px]">
        <DialogHeader>
          <DialogTitle>Filtros avançados</DialogTitle>
          <DialogDescription>Refine os alunos exibidos na listagem.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-1">

          <div className="grid gap-2">
            <Label htmlFor="course">Curso</Label>
            <Input id="course" placeholder="Ex: Inglês" value={draft.course}
              onChange={(e) => updateField("course", e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label>Turma</Label>
            <Select value={draft.turmaId || "ALL"}
              onValueChange={(v) => updateField("turmaId", v === "ALL" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Todas as turmas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as turmas</SelectItem>
                {turmas.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome} {t.cursoNome ? `· ${t.cursoNome}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Matrícula</Label>
              <Select value={draft.enrollment}
                onValueChange={(v) => updateField("enrollment", v as StudentsAdvancedFiltersState["enrollment"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="WITH">Com matrícula</SelectItem>
                  <SelectItem value="WITHOUT">Sem matrícula</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Status financeiro</Label>
              <Select value={draft.financialStatus}
                onValueChange={(v) => updateField("financialStatus", v as StudentsAdvancedFiltersState["financialStatus"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="PAID">Em dia</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="OVERDUE">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Status do aluno</Label>
              <Select value={draft.alunoStatus}
                onValueChange={(v) => updateField("alunoStatus", v as StudentsAdvancedFiltersState["alunoStatus"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                  <SelectItem value="TRANCADO">Trancado</SelectItem>
                  <SelectItem value="ARQUIVADO">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Endereço cadastrado</Label>
              <Select value={draft.hasAddress}
                onValueChange={(v) => updateField("hasAddress", v as StudentsAdvancedFiltersState["hasAddress"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="YES">Com endereço</SelectItem>
                  <SelectItem value="NO">Sem endereço</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Possui laudo</Label>
              <Select value={draft.hasLaudo}
                onValueChange={(v) => updateField("hasLaudo", v as StudentsAdvancedFiltersState["hasLaudo"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="YES">Com laudo</SelectItem>
                  <SelectItem value="NO">Sem laudo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Adaptação necessária</Label>
              <Select value={draft.hasAdaptacao}
                onValueChange={(v) => updateField("hasAdaptacao", v as StudentsAdvancedFiltersState["hasAdaptacao"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="YES">Necessita adaptação</SelectItem>
                  <SelectItem value="NO">Não necessita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={onClear}
            disabled={!hasActiveFilters} className="rounded-2xl">
            Limpar filtros
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-2xl">
              Cancelar
            </Button>
            <Button type="button" onClick={onApply} className="rounded-md">
              Aplicar filtros
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
