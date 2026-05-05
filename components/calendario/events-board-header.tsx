"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import type { EventFilter } from "@/lib/calendario/calendar-types";
import { CalendarFilters } from "@/components/calendario/calendar-filters";

interface EventsBoardHeaderProps {
  search: string;
  setSearch: (value: string) => void;
  eventFilter: EventFilter;
  setEventFilter: (value: EventFilter) => void;
}

export function EventsBoardHeader({
  search,
  setSearch,
  eventFilter,
  setEventFilter,
}: EventsBoardHeaderProps) {
  return (
    <div className="mb-6 rounded-[28px] border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] text-card-foreground">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Agenda visual
          </p>

          <h2 className="text-[34px] font-semibold tracking-[-0.04em] text-foreground">
            Eventos agendados
          </h2>
        </div>

        <Button
          asChild
          className="h-11 rounded-md px-4"
        >
          <Link href="/calendario">
            <Plus className="mr-2 h-4 w-4" />
            Novo evento
          </Link>
        </Button>
      </div>

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por evento, professor, turma ou curso..."
          className="h-11 rounded-2xl pl-9"
        />
      </div>

      <CalendarFilters value={eventFilter} onChange={setEventFilter} />
    </div>
  );
}
