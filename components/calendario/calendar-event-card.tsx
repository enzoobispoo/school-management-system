"use client";

import type { CalendarEvent } from "@/lib/calendario/calendar-types";
import {
  getEventClasses,
  getEventStyle,
  getEventTypeLabel,
} from "@/lib/calendario/calendar-utils";

interface Props {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
}

export function CalendarEventCard({ event, onClick }: Props) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const style = getEventStyle(start, end);
  const typeLabel = getEventTypeLabel(event);

  const startText = start.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const endText = end.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      onClick={() => onClick?.(event)}
      className={`absolute left-2 right-2 cursor-pointer rounded-[18px] border px-3 py-2 shadow-none transition hover:opacity-90 ${getEventClasses(
        event
      )}`}
      style={style}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-[13px] font-semibold leading-4 text-foreground">
          {event.title}
        </p>
        <span className="text-xs text-muted-foreground">•••</span>
      </div>

      <p className="text-[11px] font-medium text-muted-foreground">
        {typeLabel} • {startText} - {endText}
      </p>

      {event.turma?.nome && (
        <p className="mt-2 text-[11px] font-medium text-muted-foreground">
          {event.turma.nome}
        </p>
      )}
    </div>
  );
}