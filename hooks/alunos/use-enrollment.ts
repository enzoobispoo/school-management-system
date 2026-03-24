"use client";

import { useEffect, useMemo, useState } from "react";

interface EnrollmentStudent {
  id: string;
  nome: string;
}

interface TurmasResponse {
  data: Array<{
    id: string;
    nome: string;
    capacidadeMaxima: number;
    ativo: boolean;
    vagasOcupadas: number;
    vagasDisponiveis: number;
    curso: {
      id: string;
      nome: string;
      categoria: string;
      valorMensal: number;
      duracaoTexto?: string | null;
    };
    professor: {
      id: string;
      nome: string;
      email?: string | null;
      telefone?: string | null;
    };
    horarios: Array<{
      id: string;
      diaSemana: string;
      horaInicio: string;
      horaFim: string;
    }>;
  }>;
}

interface UseEnrollmentParams {
  open: boolean;
  aluno: EnrollmentStudent | null;
  onClose: () => void;
  onSuccess?: () => Promise<void> | void;
}

export function useEnrollment({
  open,
  aluno,
  onClose,
  onSuccess,
}: UseEnrollmentParams) {
  const [turmas, setTurmas] = useState<TurmasResponse["data"]>([]);
  const [turmaId, setTurmaId] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTurmas() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/turmas?ativo=true&page=1&pageSize=100",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Erro ao carregar turmas");
        }

        const result: TurmasResponse = await response.json();
        setTurmas(result.data.filter((turma) => turma.vagasDisponiveis > 0));
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar as turmas.");
      } finally {
        setLoading(false);
      }
    }

    if (open) {
      fetchTurmas();
    } else {
      resetState();
    }
  }, [open]);

  const turmaSelecionada = useMemo(
    () => turmas.find((turma) => turma.id === turmaId) ?? null,
    [turmaId, turmas]
  );

  function resetState() {
    setTurmaId("");
    setError("");
    setTurmas([]);
  }

  async function handleSubmit() {
    if (!aluno?.id) {
      setError("Aluno inválido.");
      return;
    }

    if (!turmaId) {
      setError("Selecione uma turma.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await fetch("/api/matriculas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          alunoId: aluno.id,
          turmaId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao criar matrícula");
      }

      resetState();
      onClose();
      await onSuccess?.();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível realizar a matrícula.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    resetState();
    onClose();
  }

  return {
    turmas,
    turmaId,
    setTurmaId,
    turmaSelecionada,
    loading,
    submitting,
    error,
    handleSubmit,
    handleClose,
  };
}