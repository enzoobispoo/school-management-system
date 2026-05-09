"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

interface UseChangeTeacherParams {
  turmaId: string;
  currentTeacherId: string;
  modalOpen: boolean;
  onSuccess?: () => Promise<void> | void;
  onClose?: () => void;
}

export interface DisciplinaTurmaOption {
  id: string;
  nome: string;
}

export interface TeacherOption {
  id: string;
  nome: string;
  disponivel: boolean;
  conflitoDescricao?: string;
  /** Já leciona turmas do mesmo curso desta troca. */
  ensinaMesmoCurso?: boolean;
  /** Relevante quando há filtro por disciplina: já trabalhou com essa disciplina na escola. */
  ensinaDisciplinaSelecionada?: boolean;
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
  modalOpen,
  onSuccess,
  onClose,
}: UseChangeTeacherParams) {
  const { t } = useDashboardLanguage();
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [disciplinasTurma, setDisciplinasTurma] = useState<DisciplinaTurmaOption[]>(
    []
  );
  const [disciplinaFilterId, setDisciplinaFilterId] = useState("");
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
    setDisciplinaFilterId("");
    setMotivoTroca("");
    setObservacoes("");
    setDataInicio(new Date().toISOString().split("T")[0]);
    setError("");
    setDisciplinasTurma([]);
    setTeachers([]);
  }, []);

  const fetchTeachers = useCallback(async () => {
    setLoadingTeachers(true);
    setError("");

    try {
      const q =
        disciplinaFilterId.trim().length > 0 ?
          `?disciplinaId=${encodeURIComponent(disciplinaFilterId.trim())}`
        : "";
      const response = await fetch(
        `/api/turmas/${turmaId}/professores-disponiveis${q}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          typeof body?.error === "string" ? body.error : "Não foi possível carregar os professores."
        );
      }

      const responseJson = await response.json();

      const rawDisciplinas = Array.isArray(responseJson?.disciplinasTurma)
        ? responseJson.disciplinasTurma
        : [];
      const normalizedDisciplinas: DisciplinaTurmaOption[] = rawDisciplinas
        .map((d: Record<string, unknown>): DisciplinaTurmaOption | null => {
          const id = String(d.id ?? "");
          const nome = String(d.nome ?? "");
          if (!id) return null;
          return { id, nome };
        })
        .filter((x: DisciplinaTurmaOption | null): x is DisciplinaTurmaOption => x != null);

      const rawTeachers = Array.isArray(responseJson?.data)
        ? responseJson.data
        : [];

      const normalized: TeacherOption[] = rawTeachers
        .map((teacher: Record<string, unknown>): TeacherOption => ({
          id: String(teacher.id),
          nome: String(teacher.nome ?? ""),
          disponivel: Boolean(teacher.disponivel),
          conflitoDescricao: teacher.conflitoDescricao
            ? String(teacher.conflitoDescricao)
            : undefined,
          ensinaMesmoCurso: Boolean(teacher.ensinaMesmoCurso),
          ensinaDisciplinaSelecionada:
            typeof teacher.ensinaDisciplinaSelecionada === "boolean" ?
              teacher.ensinaDisciplinaSelecionada
            : undefined,
        }))
        .filter((teacher: TeacherOption) => teacher.id !== currentTeacherId);

      setDisciplinasTurma(normalizedDisciplinas);
      setTeachers(normalized);
    } catch (err) {
      console.error("Erro ao carregar professores:", err);
      const message =
        err instanceof Error ? err.message : "Erro ao carregar professores.";
      setError(message);
      setTeachers([]);
      setDisciplinasTurma([]);
      toast.error(message);
    } finally {
      setLoadingTeachers(false);
    }
  }, [turmaId, currentTeacherId, disciplinaFilterId]);

  useEffect(() => {
    if (!modalOpen) return;
    void fetchTeachers();
  }, [modalOpen, fetchTeachers]);

  useEffect(() => {
    if (!modalOpen) resetForm();
  }, [modalOpen, resetForm]);

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

      const result = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
        pendenteConfirmacao?: boolean;
      } | null;

      if (!response.ok) {
        throw new Error(result?.error || t("turmas.changeTeacher.fail"));
      }

      await onSuccess?.();
      toast.success(
        result?.message ??
          (result?.pendenteConfirmacao ?
            t("turmas.changeTeacher.successPending")
          : t("turmas.changeTeacher.successImmediate"))
      );
      onClose?.();
      resetForm();
    } catch (err) {
      console.error("Erro ao trocar professor:", err);
      const message =
        err instanceof Error ? err.message : t("turmas.changeTeacher.errorGeneric");
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
    t,
  ]);

  return useMemo(
    () => ({
      teachers,
      disciplinasTurma,
      disciplinaFilterId,
      setDisciplinaFilterId,
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
      handleSubmit,
    }),
    [
      teachers,
      disciplinasTurma,
      disciplinaFilterId,
      teacherId,
      motivoTroca,
      observacoes,
      dataInicio,
      loadingTeachers,
      saving,
      error,
      handleSubmit,
    ]
  );
}
