"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

interface UseChangeTeacherParams {
  turmaId: string;
  currentTeacherId: string;
  onSuccess?: () => Promise<void> | void;
  onClose?: () => void;
}

interface TeacherOption {
  id: string;
  nome: string;
  disponivel: boolean;
  conflitoDescricao?: string;
}

interface ChangeTeacherPayload {
  professorId: string;
  motivoTroca: string;
  observacoes: string;
  dataInicio: string;
}

export function useChangeTeacher({
  turmaId,
  currentTeacherId,
  onSuccess,
  onClose,
}: UseChangeTeacherParams) {
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [motivoTroca, setMotivoTroca] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [dataInicio, setDataInicio] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const resetForm = useCallback(() => {
    setTeacherId("");
    setMotivoTroca("");
    setObservacoes("");
    setDataInicio(new Date().toISOString().split("T")[0]);
    setError("");
  }, []);

  const fetchTeachers = useCallback(async () => {
    setLoadingTeachers(true);
    setError("");

    try {
      const response = await fetch(
        `/api/turmas/${turmaId}/professores-disponiveis`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Não foi possível carregar os professores.");
      }

      const responseJson = await response.json();

      const rawTeachers = Array.isArray(responseJson?.data)
        ? responseJson.data
        : [];

      const normalized: TeacherOption[] = rawTeachers
        .map((teacher: any): TeacherOption => ({
          id: String(teacher.id),
          nome: String(teacher.nome ?? ""),
          disponivel: Boolean(teacher.disponivel),
          conflitoDescricao: teacher.conflitoDescricao
            ? String(teacher.conflitoDescricao)
            : undefined,
        }))
        .filter((teacher: TeacherOption) => teacher.id !== currentTeacherId);

      setTeachers(normalized);
    } catch (err) {
      console.error("Erro ao carregar professores:", err);
      const message =
        err instanceof Error ? err.message : "Erro ao carregar professores.";
      setError(message);
      setTeachers([]);
      toast.error(message);
    } finally {
      setLoadingTeachers(false);
    }
  }, [turmaId, currentTeacherId]);

  const handleOpenChange = useCallback(
    async (open: boolean) => {
      if (open) {
        await fetchTeachers();
      } else {
        resetForm();
      }
    },
    [fetchTeachers, resetForm]
  );

  const handleSubmit = useCallback(async () => {
    setError("");

    if (!teacherId) {
      setError("Selecione o novo professor.");
      return;
    }

    if (!dataInicio) {
      setError("Informe a data de início.");
      return;
    }

    try {
      setSaving(true);

      const payload: ChangeTeacherPayload = {
        professorId: teacherId,
        motivoTroca,
        observacoes,
        dataInicio,
      };

      const response = await fetch(`/api/turmas/${turmaId}/trocar-professor`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Não foi possível trocar o professor.");
      }

      await onSuccess?.();
      toast.success("Professor alterado com sucesso.");
      onClose?.();
      resetForm();
    } catch (err) {
      console.error("Erro ao trocar professor:", err);
      const message =
        err instanceof Error ? err.message : "Erro ao trocar professor.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [
    teacherId,
    motivoTroca,
    observacoes,
    dataInicio,
    turmaId,
    onSuccess,
    onClose,
    resetForm,
  ]);

  return useMemo(
    () => ({
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
      handleOpenChange,
      handleSubmit,
    }),
    [
      teachers,
      teacherId,
      motivoTroca,
      observacoes,
      dataInicio,
      loadingTeachers,
      saving,
      error,
      handleOpenChange,
      handleSubmit,
    ]
  );
}