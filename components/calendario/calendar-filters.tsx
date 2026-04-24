"use client";

import type { EventFilter } from "@/lib/calendario/calendar-types";

interface CalendarFiltersProps {
  value: EventFilter;
  onChange: (value: EventFilter) => void;
}

export function CalendarFilters({
  value,
  onChange,
}: CalendarFiltersProps) {
  const filters: Array<{ label: string; value: EventFilter }> = [
    { label: "Todos", value: "ALL" },
    { label: "Aulas", value: "AULA" },
    { label: "Reuniões", value: "REUNIAO" },
    { label: "Provas", value: "PROVA" },
    { label: "Reposições", value: "REPOSICAO" },
    { label: "Feriados", value: "FERIADO" },
    { label: "Lembretes", value: "LEMBRETE" },
  ];

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 overflow-hidden">
      {filters.map((filter) => {
        const isActive = value === filter.value;

        return (
          <button
            key={filter.value}
            onClick={() => onChange(filter.value)}
            className={
              isActive
                ? "max-w-full rounded-full bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
                : "max-w-full rounded-full bg-[#f6f6f6] px-4 py-2 text-sm text-[#6b7280] dark:bg-muted dark:text-muted-foreground"
            }
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}