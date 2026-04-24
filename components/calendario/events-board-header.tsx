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
    <div className="mb-6 rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-border dark:bg-card dark:text-card-foreground">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm text-black/42 dark:text-muted-foreground">
            Agenda visual
          </p>

          <h2 className="text-[34px] font-semibold tracking-[-0.04em] text-black dark:text-foreground">
            Eventos agendados
          </h2>
        </div>

        <Button
          asChild
          className="h-11 rounded-2xl bg-black px-5 text-white hover:bg-black/90 dark:bg-white/10 dark:text-white dark:backdrop-blur-md dark:hover:bg-white/20 dark:border dark:border-white/10"
        >
          <Link href="/calendario">
            <Plus className="mr-2 h-4 w-4" />
            Novo evento
          </Link>
        </Button>
      </div>

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/50 dark:text-muted-foreground" />

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por evento, professor, turma ou curso..."
          className="
    h-11 rounded-2xl pl-9
    bg-[#ffffff] border border-black/10
    text-black/60 placeholder:text-black/50

    focus:bg-white focus:border-black/10

    dark:bg-muted/40 dark:border-border dark:text-foreground
    dark:placeholder:text-muted-foreground
  "
        />
      </div>

      <CalendarFilters value={eventFilter} onChange={setEventFilter} />
    </div>
  );
}
