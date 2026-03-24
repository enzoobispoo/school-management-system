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

export type CalendarAdvancedFiltersState = {
  source: "ALL" | "MANUAL" | "AUTOMATIC";
  professor: string;
  turma: string;
  curso: string;
};

interface CalendarAdvancedFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: CalendarAdvancedFiltersState;
  draft: CalendarAdvancedFiltersState;
  onDraftChange: (value: CalendarAdvancedFiltersState) => void;
  onApply: () => void;
  onClear: () => void;
}

export function CalendarAdvancedFilters({
  open,
  onOpenChange,
  value,
  draft,
  onDraftChange,
  onApply,
  onClear,
}: CalendarAdvancedFiltersProps) {
  const hasActiveFilters =
    value.source !== "ALL" ||
    value.professor.trim() !== "" ||
    value.turma.trim() !== "" ||
    value.curso.trim() !== "";

  function updateField<K extends keyof CalendarAdvancedFiltersState>(
    field: K,
    fieldValue: CalendarAdvancedFiltersState[K]
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
            Refine os eventos exibidos no calendário.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label htmlFor="source">Origem do evento</Label>
            <Select
              value={draft.source}
              onValueChange={(value) =>
                updateField(
                  "source",
                  value as CalendarAdvancedFiltersState["source"]
                )
              }
            >
              <SelectTrigger id="source">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="MANUAL">Manuais</SelectItem>
                <SelectItem value="AUTOMATIC">Automáticos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="professor">Professor</Label>
            <Input
              id="professor"
              placeholder="Ex: Maria Silva"
              value={draft.professor}
              onChange={(e) => updateField("professor", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="turma">Turma</Label>
            <Input
              id="turma"
              placeholder="Ex: Turma A"
              value={draft.turma}
              onChange={(e) => updateField("turma", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="curso">Curso</Label>
            <Input
              id="curso"
              placeholder="Ex: Inglês"
              value={draft.curso}
              onChange={(e) => updateField("curso", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClear}
            disabled={!hasActiveFilters}
          >
            Limpar filtros
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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