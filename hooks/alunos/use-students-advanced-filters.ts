"use client";

import { useMemo, useState } from "react";
import type { StudentTableItem } from "@/hooks/alunos/use-students-query";

export type StudentsAdvancedFiltersState = {
  course: string;
  enrollment: "ALL" | "WITH" | "WITHOUT";
  financialStatus: "ALL" | "PAID" | "PENDING" | "OVERDUE";
  hasAddress: "ALL" | "YES" | "NO";
};

const defaultAdvancedFilters: StudentsAdvancedFiltersState = {
  course: "",
  enrollment: "ALL",
  financialStatus: "ALL",
  hasAddress: "ALL",
};

interface UseStudentsAdvancedFiltersParams {
  students: StudentTableItem[];
}

export function useStudentsAdvancedFilters({
  students,
}: UseStudentsAdvancedFiltersParams) {
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] =
    useState<StudentsAdvancedFiltersState>(defaultAdvancedFilters);
  const [advancedFiltersDraft, setAdvancedFiltersDraft] =
    useState<StudentsAdvancedFiltersState>(defaultAdvancedFilters);

  const hasAdvancedFilters = useMemo(() => {
    return (
      advancedFilters.course.trim() !== "" ||
      advancedFilters.enrollment !== "ALL" ||
      advancedFilters.financialStatus !== "ALL" ||
      advancedFilters.hasAddress !== "ALL"
    );
  }, [advancedFilters]);

  const filteredStudents = useMemo(() => {
    let result = [...students];

    if (advancedFilters.course.trim()) {
      const course = advancedFilters.course.trim().toLowerCase();
      result = result.filter((student) =>
        student.courses.some((item) => item.toLowerCase().includes(course))
      );
    }

    if (advancedFilters.enrollment !== "ALL") {
      result = result.filter((student) => {
        const hasEnrollment =
          student.courses.length > 0 && !student.courses.includes("Sem matrícula");

        if (advancedFilters.enrollment === "WITH") return hasEnrollment;
        return !hasEnrollment;
      });
    }

    if (advancedFilters.financialStatus !== "ALL") {
      result = result.filter((student) => {
        if (advancedFilters.financialStatus === "PAID") {
          return student.paymentStatus === "paid";
        }
        if (advancedFilters.financialStatus === "PENDING") {
          return student.paymentStatus === "pending";
        }
        return student.paymentStatus === "overdue";
      });
    }

    if (advancedFilters.hasAddress !== "ALL") {
      result = result.filter((student) => {
        const hasAddress = Boolean(student.address?.trim());

        if (advancedFilters.hasAddress === "YES") return hasAddress;
        return !hasAddress;
      });
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
  }

  function clearAdvancedFilters() {
    setAdvancedFilters(defaultAdvancedFilters);
    setAdvancedFiltersDraft(defaultAdvancedFilters);
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