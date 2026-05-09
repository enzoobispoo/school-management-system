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
import type {
  DisciplinaTurmaOption,
  TeacherOption,
} from "@/hooks/turmas/use-change-teacher";

interface ChangeTeacherFormProps {
  disciplinasTurma: DisciplinaTurmaOption[];
  disciplinaFilterId: string;
  setDisciplinaFilterId: (value: string) => void;
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
  disciplinasTurma,
  disciplinaFilterId,
  setDisciplinaFilterId,
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
  const disciplinaSelectValue = disciplinaFilterId.trim() || "__all__";

  return (
    <div className="space-y-5">
      {disciplinasTurma.length > 0 ?
        <div className="space-y-2">
          <Label>Disciplina (filtro opcional)</Label>
          <Select
            value={disciplinaSelectValue}
            onValueChange={(v) =>
              setDisciplinaFilterId(v === "__all__" ? "" : v)
            }
            disabled={loadingTeachers || saving}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Qualquer disciplina" />
            </SelectTrigger>
            <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[380px]">
              <SelectItem value="__all__">Qualquer disciplina</SelectItem>
              {disciplinasTurma.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Com uma disciplina selecionada, a lista prioriza quem já leciona esse conteúdo em outras
            turmas ou avaliações (selo &quot;Disciplina&quot;).
          </p>
        </div>
      : <p className="rounded-xl border border-dashed border-border/70 px-3 py-2 text-[11px] leading-snug text-muted-foreground">
          Cadastre disciplinas vinculadas à turma para poder filtrar professores por matéria.
        </p>
      }

      <div className="space-y-2">
        <Label>Novo professor</Label>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Lista ordenada: primeiro quem está livre no horário da turma; com disciplina filtrada, quem
          já trabalhou com ela; depois quem já leciona o mesmo curso (selo &quot;Mesmo curso&quot;).
        </p>

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
                    <div className="flex flex-wrap items-center gap-2">
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
                      {teacher.ensinaDisciplinaSelecionada ?
                        <span className="shrink-0 rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium text-sky-900 dark:text-sky-300">
                          Disciplina
                        </span>
                      : null}
                      {teacher.ensinaMesmoCurso ?
                        <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:text-amber-300">
                          Mesmo curso
                        </span>
                      : null}
                    </div>

                    {!teacher.disponivel && teacher.conflitoDescricao ?
                      <p className="max-w-full whitespace-normal break-words text-[11px] leading-relaxed text-muted-foreground">
                        {teacher.conflitoDescricao}
                      </p>
                    : null}
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

      {error ?
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      : null}

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
          {saving ?
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          : "Salvar troca"}
        </Button>
      </div>
    </div>
  );
}
