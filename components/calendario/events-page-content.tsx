"use client";

import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { EventsBoardHeader } from "@/components/calendario/events-board-header";
import { EventsBoardColumns } from "@/components/calendario/events-board-columns";
import type { CalendarEvent, EventFilter } from "@/lib/calendario/calendar-types";

interface EventsPageContentProps {
  loading: boolean;
  error: string;
  search: string;
  setSearch: (value: string) => void;
  eventFilter: EventFilter;
  setEventFilter: (value: EventFilter) => void;
  filteredEvents: CalendarEvent[];
}

export function EventsPageContent({
  loading,
  error,
  search,
  setSearch,
  eventFilter,
  setEventFilter,
  filteredEvents,
}: EventsPageContentProps) {
  return (
    <div className="p-6 space-y-6">
      <EventsBoardHeader
        search={search}
        setSearch={setSearch}
        eventFilter={eventFilter}
        setEventFilter={setEventFilter}
      />

      <div className="min-h-[300px]">
        {error ? (
          <ErrorState message={error} />
        ) : loading ? (
          <LoadingState message="Carregando eventos..." />
        ) : (
          <EventsBoardColumns events={filteredEvents} />
        )}
      </div>
    </div>
  );
}