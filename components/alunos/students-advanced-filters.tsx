"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  const hasActiveFilters =
    value.course.trim() !== "" ||
    value.enrollment !== "ALL" ||
    value.financialStatus !== "ALL" ||
    value.hasAddress !== "ALL";

  function updateField<K extends keyof StudentsAdvancedFiltersState>(
    field: K,
    fieldValue: StudentsAdvancedFiltersState[K]
  ) {
    onDraftChange({
      ...draft,
      [field]: fieldValue,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] rounded-[28px]">
        <DialogHeader>
          <DialogTitle>Filtros avançados</DialogTitle>
          <DialogDescription>
            Refine os alunos exibidos na listagem.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label htmlFor="course">Curso</Label>
            <Input
              id="course"
              placeholder="Ex: Inglês"
              value={draft.course}
              onChange={(e) => updateField("course", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="enrollment">Matrícula</Label>
            <Select
              value={draft.enrollment}
              onValueChange={(value) =>
                updateField(
                  "enrollment",
                  value as StudentsAdvancedFiltersState["enrollment"]
                )
              }
            >
              <SelectTrigger id="enrollment">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="WITH">Com matrícula</SelectItem>
                <SelectItem value="WITHOUT">Sem matrícula</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="financialStatus">Status financeiro</Label>
            <Select
              value={draft.financialStatus}
              onValueChange={(value) =>
                updateField(
                  "financialStatus",
                  value as StudentsAdvancedFiltersState["financialStatus"]
                )
              }
            >
              <SelectTrigger id="financialStatus">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="PAID">Em dia</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="OVERDUE">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="hasAddress">Endereço cadastrado</Label>
            <Select
              value={draft.hasAddress}
              onValueChange={(value) =>
                updateField(
                  "hasAddress",
                  value as StudentsAdvancedFiltersState["hasAddress"]
                )
              }
            >
              <SelectTrigger id="hasAddress">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="YES">Com endereço</SelectItem>
                <SelectItem value="NO">Sem endereço</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClear}
            disabled={!hasActiveFilters}
            className="rounded-2xl"
          >
            Limpar filtros
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={onApply}
              className="rounded-2xl bg-black text-white hover:bg-black/90"
            >
              Aplicar filtros
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}