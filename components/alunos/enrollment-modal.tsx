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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEnrollment } from "@/hooks/alunos/use-enrollment";
import { EnrollmentDetailsCard } from "@/components/alunos/enrollment/enrollment-details-card";

interface EnrollmentModalProps {
  open: boolean;
  onClose: () => void;
  aluno: {
    id: string;
    nome: string;
  } | null;
  onSuccess?: () => Promise<void> | void;
}

export function EnrollmentModal({
  open,
  onClose,
  aluno,
  onSuccess,
}: EnrollmentModalProps) {
  const {
    turmas,
    turmaId,
    setTurmaId,
    turmaSelecionada,
    loading,
    submitting,
    error,
    handleSubmit,
    handleClose,
  } = useEnrollment({
    open,
    aluno,
    onClose,
    onSuccess,
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-[560px] rounded-[28px]">
        <DialogHeader>
          <DialogTitle>Matricular aluno em turma</DialogTitle>
          <DialogDescription>
            {aluno
              ? `Selecione a turma para ${aluno.nome}.`
              : "Selecione uma turma."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Turma</Label>
            <Select
              value={turmaId}
              onValueChange={setTurmaId}
              disabled={loading || turmas.length === 0}
            >
              <SelectTrigger className="rounded-2xl">
                <SelectValue
                  placeholder={
                    loading
                      ? "Carregando turmas..."
                      : turmas.length === 0
                      ? "Nenhuma turma disponível"
                      : "Selecione uma turma"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {turmas.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.nome} • {turma.curso.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!loading && turmas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma turma com vaga disponível.
              </p>
            ) : null}
          </div>

          {turmaSelecionada ? (
            <EnrollmentDetailsCard turma={turmaSelecionada} />
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-2xl"
          >
            Cancelar
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!aluno?.id || !turmaId || submitting || loading}
            className="rounded-2xl"
          >
            {submitting ? "Matriculando..." : "Confirmar matrícula"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}