"use client";

import { CalendarToolbar } from "@/components/calendario/calendar-toolbar";
import { CalendarFilters } from "@/components/calendario/calendar-filters";
import { CalendarGrid } from "@/components/calendario/calendar-grid";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { addDays, formatWeekRange } from "@/lib/calendario/calendar-utils";
import type { CalendarEvent, EventFilter } from "@/lib/calendario/calendar-types";

interface CalendarPageContentProps {
  referenceDate: Date;
  setReferenceDate: (date: Date) => void;
  weekStart: Date;
  weekDays: Date[];
  filteredEvents: CalendarEvent[];
  loading: boolean;
  error: string;
  eventFilter: EventFilter;
  setEventFilter: (value: EventFilter) => void;
  openCreateModal: () => void;
  openAdvancedFilters: () => void;
  hasAdvancedFilters: boolean;
  handleCalendarClick: (day: Date, hour: number) => void;
  openEventDetails: (event: CalendarEvent) => void;
}

export function CalendarPageContent({
  referenceDate,
  setReferenceDate,
  weekStart,
  weekDays,
  filteredEvents,
  loading,
  error,
  eventFilter,
  setEventFilter,
  openCreateModal,
  openAdvancedFilters,
  hasAdvancedFilters,
  handleCalendarClick,
  openEventDetails,
}: CalendarPageContentProps) {
  return (
    <div className="p-6">
      <CalendarToolbar
        title={formatWeekRange(weekStart)}
        onPrev={() => setReferenceDate(addDays(referenceDate, -7))}
        onToday={() => setReferenceDate(new Date())}
        onNext={() => setReferenceDate(addDays(referenceDate, 7))}
        onCreate={openCreateModal}
        onOpenFilters={openAdvancedFilters}
        hasAdvancedFilters={hasAdvancedFilters}
      />

      <CalendarFilters value={eventFilter} onChange={setEventFilter} />

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <LoadingState message="Carregando calendário..." />
      ) : (
        <CalendarGrid
          weekDays={weekDays}
          events={filteredEvents}
          onSlotClick={handleCalendarClick}
          onEventClick={openEventDetails}
        />
      )}
    </div>
  );
}