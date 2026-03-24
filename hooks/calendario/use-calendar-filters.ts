"use client";

import { useMemo, useState } from "react";
import type { CalendarEvent, EventFilter } from "@/lib/calendario/calendar-types";
import type { CalendarAdvancedFiltersState } from "@/components/calendario/calendar-advanced-filters";

const defaultAdvancedFilters: CalendarAdvancedFiltersState = {
  source: "ALL",
  professor: "",
  turma: "",
  curso: "",
};

export function useCalendarFilters(events: CalendarEvent[]) {
  const [eventFilter, setEventFilter] = useState<EventFilter>("ALL");
  const [advancedFilters, setAdvancedFilters] =
    useState<CalendarAdvancedFiltersState>(defaultAdvancedFilters);
  const [advancedFiltersDraft, setAdvancedFiltersDraft] =
    useState<CalendarAdvancedFiltersState>(defaultAdvancedFilters);

  const hasAdvancedFilters = useMemo(() => {
    return (
      advancedFilters.source !== "ALL" ||
      advancedFilters.professor.trim() !== "" ||
      advancedFilters.turma.trim() !== "" ||
      advancedFilters.curso.trim() !== ""
    );
  }, [advancedFilters]);

  const filteredEvents = useMemo(() => {
    let result = events;

    if (eventFilter !== "ALL") {
      result = result.filter((event) => {
        if (eventFilter === "AULA") {
          return event.source === "automatic" || event.type === "AULA";
        }

        return event.type === eventFilter;
      });
    }

    if (advancedFilters.source !== "ALL") {
      result = result.filter((event) => {
        if (advancedFilters.source === "MANUAL") {
          return event.source === "manual";
        }

        return event.source === "automatic";
      });
    }

    if (advancedFilters.professor.trim()) {
      const professor = advancedFilters.professor.trim().toLowerCase();
      result = result.filter((event) =>
        event.professor?.nome.toLowerCase().includes(professor)
      );
    }

    if (advancedFilters.turma.trim()) {
      const turma = advancedFilters.turma.trim().toLowerCase();
      result = result.filter((event) =>
        event.turma?.nome.toLowerCase().includes(turma)
      );
    }

    if (advancedFilters.curso.trim()) {
      const curso = advancedFilters.curso.trim().toLowerCase();
      result = result.filter((event) =>
        event.curso?.nome.toLowerCase().includes(curso)
      );
    }

    return result;
  }, [events, eventFilter, advancedFilters]);

  function applyAdvancedFilters() {
    setAdvancedFilters(advancedFiltersDraft);
  }

  function clearAdvancedFilters() {
    setAdvancedFilters(defaultAdvancedFilters);
    setAdvancedFiltersDraft(defaultAdvancedFilters);
  }

  return {
    eventFilter,
    setEventFilter,

    advancedFilters,
    advancedFiltersDraft,
    setAdvancedFiltersDraft,
    hasAdvancedFilters,

    filteredEvents,
    applyAdvancedFilters,
    clearAdvancedFilters,
  };
}