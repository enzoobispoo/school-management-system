"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

interface TurmasResponse {
  data: Array<{
    id: string;
    nome: string;
    capacidadeMaxima: number;
    ativo: boolean;
    createdAt: string;
    updatedAt: string;
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
      email: string | null;
      telefone: string | null;
    } | null;
    horarios: Array<{
      id: string;
      diaSemana: string;
      horaInicio: string;
      horaFim: string;
    }>;
    matriculas: Array<{
      id: string;
      status: string;
      dataMatricula: string;
      aluno: {
        id: string;
        nome: string;
        email: string | null;
        telefone: string | null;
        status: string;
      };
    }>;
  }>;
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface TurmaCardItem {
  id: string;
  name: string;
  active: boolean;
  courseName: string;
  courseCategory: string;
  occupied: number;
  capacity: number;
  available: number;
  teacherId?: string | null;
  teacherName?: string | null;
  scheduleText: string;
  students: {
    id: string;
    nome: string;
  }[];
}

const dayMap: Record<string, string> = {
  SEGUNDA: "Seg",
  TERCA: "Ter",
  QUARTA: "Qua",
  QUINTA: "Qui",
  SEXTA: "Sex",
  SABADO: "Sáb",
  DOMINGO: "Dom",
};

function formatSchedule(
  horarios: Array<{
    diaSemana: string;
    horaInicio: string;
    horaFim: string;
  }>
) {
  if (!horarios.length) return "Sem horário";

  return horarios
    .map((horario) => {
      const dia = dayMap[horario.diaSemana] ?? horario.diaSemana;
      return `${dia} ${horario.horaInicio}-${horario.horaFim}`;
    })
    .join(" • ");
}

function normalizeTurmas(apiData: TurmasResponse["data"]): TurmaCardItem[] {
  return apiData.map((turma) => ({
    id: turma.id,
    name: turma.nome,
    active: turma.ativo,
    capacity: turma.capacidadeMaxima,
    occupied: turma.vagasOcupadas,
    available: turma.vagasDisponiveis,
    courseName: turma.curso.nome,
    courseCategory: turma.curso.categoria,
    teacherId: turma.professor?.id ?? null,
    teacherName: turma.professor?.nome ?? null,
    scheduleText: formatSchedule(turma.horarios),
    students: turma.matriculas.map((matricula) => ({
      id: matricula.aluno.id,
      nome: matricula.aluno.nome,
    })),
  }));
}

export function useTurmasPage() {
  const searchParams = useSearchParams();
  const professorId = searchParams.get("professorId") || "";
  const ativoParam = searchParams.get("ativo");
  const ocupacao = searchParams.get("ocupacao") || "";

  const [turmas, setTurmas] = useState<TurmaCardItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => {
    if (ativoParam === "true") return "active";
    if (ativoParam === "false") return "inactive";
    return "all";
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<TurmasResponse["meta"]>({
    total: 0,
    page: 1,
    pageSize: 12,
    totalPages: 1,
  });

  const ativoQuery = useMemo(() => {
    if (statusFilter === "all") return "";
    if (statusFilter === "active") return "true";
    if (statusFilter === "inactive") return "false";
    return "";
  }, [statusFilter]);

  const fetchTurmas = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "12");

      if (search.trim()) params.set("search", search.trim());
      if (professorId) params.set("professorId", professorId);
      if (ativoQuery) params.set("ativo", ativoQuery);

      const response = await fetch(`/api/turmas?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Falha ao carregar turmas");
      }

      const result: TurmasResponse = await response.json();
      let normalized = normalizeTurmas(result.data);

      if (ocupacao === "lotadas") {
        normalized = normalized.filter((turma) => turma.occupied >= turma.capacity);
      }

      if (ocupacao === "ociosas") {
        normalized = normalized.filter((turma) => turma.available > 0);
      }

      setTurmas(normalized);
      setMeta(result.meta);
    } catch (err) {
      console.error("Erro ao buscar turmas:", err);
      setError("Não foi possível carregar as turmas.");
      setTurmas([]);
      setMeta({
        total: 0,
        page: 1,
        pageSize: 12,
        totalPages: 1,
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, professorId, ativoQuery, ocupacao]);

  useEffect(() => {
    setPage(1);
  }, [professorId, ativoParam, ocupacao]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchTurmas();
    }, 300);

    return () => clearTimeout(timeout);
  }, [fetchTurmas]);

  return {
    professorId,
    turmas,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    loading,
    error,
    page,
    setPage,
    meta,
    refetchTurmas: fetchTurmas,
  };
}