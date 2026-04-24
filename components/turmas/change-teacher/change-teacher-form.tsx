"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeacherOption {
  id: string;
  nome: string;
  disponivel: boolean;
  conflitoDescricao?: string;
}

interface ChangeTeacherFormProps {
  teachers: TeacherOption[];
  teacherId: string;
  setTeacherId: (value: string) => void;
  motivoTroca: string;
  setMotivoTroca: (value: string) => void;
  observacoes: string;
  setObservacoes: (value: string) => void;
  dataInicio: string;
  setDataInicio: (value: string) => void;
  loadingTeachers: boolean;
  saving: boolean;
  error: string;
  onCancel: () => void;
  onSubmit: () => void;
}

export function ChangeTeacherForm({
  teachers,
  teacherId,
  setTeacherId,
  motivoTroca,
  setMotivoTroca,
  observacoes,
  setObservacoes,
  dataInicio,
  setDataInicio,
  loadingTeachers,
  saving,
  error,
  onCancel,
  onSubmit,
}: ChangeTeacherFormProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Novo professor</Label>

        <Select
          value={teacherId}
          onValueChange={setTeacherId}
          disabled={loadingTeachers || saving}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                loadingTeachers
                  ? "Carregando professores..."
                  : "Selecione um professor"
              }
            />
          </SelectTrigger>

          <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[380px]">
            {loadingTeachers ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Carregando professores...
              </div>
            ) : teachers.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Nenhum professor encontrado.
              </div>
            ) : (
              teachers.map((teacher) => (
                <SelectItem
  key={teacher.id}
  value={teacher.id}
  disabled={!teacher.disponivel}
  className="py-3"
>
  <div className="flex min-w-0 flex-col gap-1">
    <div className="flex items-center gap-2">
      <span className="truncate font-medium">{teacher.nome}</span>

      {teacher.disponivel ? (
        <span className="shrink-0 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:text-green-400">
          Disponível
        </span>
      ) : (
        <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
          Conflito
        </span>
      )}
    </div>

    {!teacher.disponivel && teacher.conflitoDescricao ? (
      <p className="max-w-full whitespace-normal break-words text-[11px] leading-relaxed text-muted-foreground">
        {teacher.conflitoDescricao}
      </p>
    ) : null}
  </div>
</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Data de início</Label>
        <Input
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          disabled={saving}
        />
      </div>

      <div className="space-y-2">
        <Label>Motivo da troca</Label>
        <Input
          placeholder="Ex: reorganização de agenda"
          value={motivoTroca}
          onChange={(e) => setMotivoTroca(e.target.value)}
          disabled={saving}
        />
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          placeholder="Observações adicionais sobre a troca..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          disabled={saving}
          rows={4}
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
        >
          Cancelar
        </Button>

        <Button
          type="button"
          onClick={onSubmit}
          disabled={saving || loadingTeachers}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar troca"
          )}
        </Button>
      </div>
    </div>
  );
}
