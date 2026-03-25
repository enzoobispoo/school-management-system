"use client";

import { useEffect, useMemo, useState } from "react";
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
    };
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
  capacity: number;
  occupied: number;
  available: number;
  courseName: string;
  courseCategory: string;
  teacherId: string;
  teacherName: string;
  scheduleText: string;
  students: Array<{
    id: string;
    nome: string;
  }>;
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
    teacherId: turma.professor.id,
    teacherName: turma.professor.nome,
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

  const [turmas, setTurmas] = useState<TurmaCardItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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

  async function fetchTurmas() {
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
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Falha ao carregar turmas");
      }

      const result: TurmasResponse = await response.json();
      setTurmas(normalizeTurmas(result.data));
      setMeta(result.meta);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar as turmas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchTurmas();
    }, 300);

    return () => clearTimeout(timeout);
  }, [page, search, ativoQuery, professorId]);

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
    fetchTurmas,
  };
}