"use client";

import type { CalendarEvent } from "@/lib/calendario/calendar-types";
import { getEventTypeLabel } from "@/lib/calendario/calendar-utils";

interface UpcomingEventsListProps {
  events: CalendarEvent[];
  emptyMessage?: string;
}

export function UpcomingEventsList({
  events,
  emptyMessage = "Nenhum evento próximo.",
}: UpcomingEventsListProps) {
  if (!events.length) {
    return (
      <div className="rounded-3xl border border-black/5 bg-white p-4 text-sm text-muted-foreground shadow-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-black">Próximos eventos</h3>
      </div>

      <div className="space-y-3">
        {events.map((event) => {
          const start = new Date(event.start);

          return (
            <div
              key={event.id}
              className="rounded-2xl border border-black/5 p-3"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-black">{event.title}</p>
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {getEventTypeLabel(event)}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                {start.toLocaleDateString("pt-BR")} •{" "}
                {start.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              {event.turma?.nome ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {event.turma.nome}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}