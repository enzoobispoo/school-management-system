"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { StudentTableItem } from "@/hooks/alunos/use-students-query";

export type StudentsAdvancedFiltersState = {
  course: string;
  turmaId: string;
  enrollment: "ALL" | "WITH" | "WITHOUT";
  financialStatus: "ALL" | "PAID" | "PENDING" | "OVERDUE";
  hasAddress: "ALL" | "YES" | "NO";
  hasLaudo: "ALL" | "YES" | "NO";
  hasAdaptacao: "ALL" | "YES" | "NO";
  alunoStatus: "ALL" | "ATIVO" | "INATIVO" | "TRANCADO" | "ARQUIVADO";
};

const defaultAdvancedFilters: StudentsAdvancedFiltersState = {
  course: "",
  turmaId: "",
  enrollment: "ALL",
  financialStatus: "ALL",
  hasAddress: "ALL",
  hasLaudo: "ALL",
  hasAdaptacao: "ALL",
  alunoStatus: "ALL",
};

interface UseStudentsAdvancedFiltersParams {
  students: StudentTableItem[];
}

export function useStudentsAdvancedFilters({ students }: UseStudentsAdvancedFiltersParams) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<StudentsAdvancedFiltersState>(defaultAdvancedFilters);
  const [advancedFiltersDraft, setAdvancedFiltersDraft] = useState<StudentsAdvancedFiltersState>(defaultAdvancedFilters);

  const hasAdvancedFilters = useMemo(() => {
    return (
      advancedFilters.course.trim() !== "" ||
      advancedFilters.turmaId !== "" ||
      advancedFilters.enrollment !== "ALL" ||
      advancedFilters.financialStatus !== "ALL" ||
      advancedFilters.hasAddress !== "ALL" ||
      advancedFilters.hasLaudo !== "ALL" ||
      advancedFilters.hasAdaptacao !== "ALL" ||
      advancedFilters.alunoStatus !== "ALL"
    );
  }, [advancedFilters]);

  const filteredStudents = useMemo(() => {
    let result = [...students];

    if (advancedFilters.course.trim()) {
      const course = advancedFilters.course.trim().toLowerCase();
      result = result.filter((s) => s.courses.some((c) => c.toLowerCase().includes(course)));
    }

    if (advancedFilters.enrollment !== "ALL") {
      result = result.filter((s) => {
        const has = s.courses.length > 0 && !s.courses.includes("Sem matrícula");
        return advancedFilters.enrollment === "WITH" ? has : !has;
      });
    }

    if (advancedFilters.financialStatus !== "ALL") {
      result = result.filter((s) => {
        if (advancedFilters.financialStatus === "PAID") return s.paymentStatus === "paid";
        if (advancedFilters.financialStatus === "PENDING") return s.paymentStatus === "pending";
        return s.paymentStatus === "overdue";
      });
    }

    if (advancedFilters.hasAddress !== "ALL") {
      result = result.filter((s) => {
        const has = Boolean(s.address?.trim());
        return advancedFilters.hasAddress === "YES" ? has : !has;
      });
    }

    if (advancedFilters.hasLaudo !== "ALL") {
      result = result.filter((s) => {
        const has = s.health?.possuiLaudo === true;
        return advancedFilters.hasLaudo === "YES" ? has : !has;
      });
    }

    if (advancedFilters.hasAdaptacao !== "ALL") {
      result = result.filter((s) => {
        const has = s.health?.adaptacaoNecessaria === true;
        return advancedFilters.hasAdaptacao === "YES" ? has : !has;
      });
    }

    if (advancedFilters.alunoStatus !== "ALL") {
      result = result.filter((s) => s.alunoStatus === advancedFilters.alunoStatus);
    }

    return result;
  }, [students, advancedFilters]);

  function openAdvancedFilters() {
    setAdvancedFiltersDraft(advancedFilters);
    setAdvancedFiltersOpen(true);
  }

  function applyAdvancedFilters() {
    setAdvancedFilters(advancedFiltersDraft);
    setAdvancedFiltersOpen(false);

    const params = new URLSearchParams(searchParams.toString());
    if (advancedFiltersDraft.turmaId) {
      params.set("turmaId", advancedFiltersDraft.turmaId);
    } else {
      params.delete("turmaId");
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function clearAdvancedFilters() {
    setAdvancedFilters(defaultAdvancedFilters);
    setAdvancedFiltersDraft(defaultAdvancedFilters);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("turmaId");
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return {
    advancedFiltersOpen,
    setAdvancedFiltersOpen,
    advancedFilters,
    advancedFiltersDraft,
    setAdvancedFiltersDraft,
    hasAdvancedFilters,
    filteredStudents,
    openAdvancedFilters,
    applyAdvancedFilters,
    clearAdvancedFilters,
  };
}
