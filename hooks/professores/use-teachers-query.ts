"use client";

import { useEffect, useMemo, useState } from "react";

interface ProfessoresResponse {
  data: Array<{
    id: string;
    nome: string;
    email: string | null;
    telefone: string | null;
    ativo: boolean;
    cursos: Array<{
      id: string;
      nome: string;
      categoria: string;
    }>;
    agenda: Array<{
      turmaId: string;
      turmaNome: string;
      cursoId: string;
      cursoNome: string;
      diaSemana: string;
      horaInicio: string;
      horaFim: string;
    }>;
  }>;
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface TeacherCardItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  courses: string[];
  schedule: Array<{
    day: string;
    time: string;
    course: string;
    class: string;
  }>;
  initials: string;
  active: boolean;
}

const dayMap: Record<string, string> = {
  SEGUNDA: "Segunda-feira",
  TERCA: "Terça-feira",
  QUARTA: "Quarta-feira",
  QUINTA: "Quinta-feira",
  SEXTA: "Sexta-feira",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function normalizeTeachers(
  apiData: ProfessoresResponse["data"]
): TeacherCardItem[] {
  return apiData.map((teacher) => ({
    id: teacher.id,
    name: teacher.nome,
    email: teacher.email ?? "-",
    phone: teacher.telefone ?? "-",
    courses: teacher.cursos.map((course) => course.nome),
    initials: getInitials(teacher.nome),
    active: teacher.ativo,
    schedule: teacher.agenda.map((item) => ({
      day: dayMap[item.diaSemana] ?? item.diaSemana,
      time: `${item.horaInicio} - ${item.horaFim}`,
      course: item.cursoNome,
      class: item.turmaNome,
    })),
  }));
}

export function useTeachersQuery() {
  const [teachers, setTeachers] = useState<TeacherCardItem[]>([]);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const courseQuery = useMemo(() => {
    if (courseFilter === "all") return "";
    return courseFilter;
  }, [courseFilter]);

  async function fetchTeachers() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("pageSize", "50");

      if (search.trim()) params.set("search", search.trim());

      const response = await fetch(`/api/professores?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Falha ao carregar professores");
      }

      const result: ProfessoresResponse = await response.json();
      let normalized = normalizeTeachers(result.data);

      if (courseQuery) {
        normalized = normalized.filter((teacher) =>
          teacher.courses.some((course) =>
            course.toLowerCase().includes(courseQuery.toLowerCase())
          )
        );
      }

      setTeachers(normalized);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os professores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchTeachers();
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, courseQuery]);

  return {
    teachers,
    search,
    setSearch,
    courseFilter,
    setCourseFilter,
    loading,
    error,
    setError,
    fetchTeachers,
  };
}