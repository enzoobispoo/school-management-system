"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

interface ApiCourseResponse {
  data: Array<{
    id: string;
    nome: string;
    categoria: string;
    descricao?: string | null;
    duracaoTexto?: string | null;
    valorMensal: number;
    ativo: boolean;
    totalAlunos: number;
    totalTurmas: number;
    turmas: Array<{
      id: string;
      nome: string;
      capacidadeMaxima: number;
      ativo: boolean;
      totalAlunos: number;
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
    }>;
  }>;
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface CourseCardItem {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: string;
  active: boolean;
  studentsEnrolled: number;
  classes: Array<{
    name: string;
    schedule: string;
    teacher: string;
    students: number;
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
  if (!horarios || horarios.length === 0) return "Sem horário";

  const ordered = [...horarios].sort((a, b) =>
    a.horaInicio.localeCompare(b.horaInicio)
  );

  const dias = ordered.map((h) => dayMap[h.diaSemana] ?? h.diaSemana);
  const hora = ordered[0]?.horaInicio ?? "";

  return `${dias.join("/")} ${hora}`;
}

function normalizeCourses(
  apiCourses: ApiCourseResponse["data"]
): CourseCardItem[] {
  return apiCourses.map((course) => ({
    id: course.id,
    name: course.nome,
    category: course.categoria,
    price: course.valorMensal,
    duration: course.duracaoTexto || "-",
    active: course.ativo,
    studentsEnrolled: course.totalAlunos,
    classes: course.turmas.map((turma) => ({
      name: turma.nome,
      schedule: formatSchedule(turma.horarios),
      teacher: turma.professor.nome,
      students: turma.totalAlunos,
    })),
  }));
}

export function useCoursesQuery() {
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id") || "";
  const [courses, setCourses] = useState<CourseCardItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categoryQuery = useMemo(() => {
    if (category === "all") return "";
    if (category === "idiomas") return "Idiomas";
    if (category === "musica") return "Música";
    if (category === "tecnologia") return "Tecnologia";
    if (category === "educacao") return "Educação";
    return "";
  }, [category]);

  async function fetchCourses() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("pageSize", "50");

      if (selectedId) params.set("id", selectedId);
      if (search.trim()) params.set("search", search.trim());
      if (categoryQuery) params.set("categoria", categoryQuery);

      const response = await fetch(`/api/cursos?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Falha ao carregar cursos");
      }

      const result: ApiCourseResponse = await response.json();
      setCourses(normalizeCourses(result.data));
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os cursos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCourses();
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, categoryQuery, selectedId]);

  return {
    courses,
    search,
    setSearch,
    category,
    setCategory,
    loading,
    error,
    setError,
    fetchCourses,
  };
}