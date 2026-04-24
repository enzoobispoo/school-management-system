"use client";

import type { CalendarEvent } from "@/lib/calendario/calendar-types";
import { EventsBoardCard } from "@/components/calendario/events-board-card";

interface EventsBoardColumnProps {
  title: string;
  count?: number;
  events: CalendarEvent[];
}

export function EventsBoardColumn({
  title,
  count,
  events,
}: EventsBoardColumnProps) {
  return (
    <div className="min-w-[280px] flex-1">
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {typeof count === "number" ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
              {count}
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        {events.length > 0 ? (
          events.map((event) => <EventsBoardCard key={event.id} event={event} />)
        ) : (
          <div className="rounded-[26px] border border-dashed border-border bg-card/60 p-6 text-sm text-muted-foreground backdrop-blur-sm">
            Nenhum evento nesta coluna.
          </div>
        )}
      </div>
    </div>
  );
}