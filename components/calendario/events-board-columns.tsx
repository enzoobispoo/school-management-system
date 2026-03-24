"use client";

import { useMemo } from "react";
import type { CalendarEvent } from "@/lib/calendario/calendar-types";
import { EventsBoardColumn } from "@/components/calendario/events-board-column";

interface EventsBoardColumnsProps {
  events: CalendarEvent[];
}

function isToday(date: Date) {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function isThisWeek(date: Date) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return date >= start && date <= end;
}

export function EventsBoardColumns({ events }: EventsBoardColumnsProps) {
  const columns = useMemo(() => {
    const hoje: CalendarEvent[] = [];
    const semana: CalendarEvent[] = [];
    const proximos: CalendarEvent[] = [];
    const automaticos: CalendarEvent[] = [];

    events.forEach((event) => {
      const start = new Date(event.start);

      if (event.source === "automatic") {
        automaticos.push(event);
        return;
      }

      if (isToday(start)) {
        hoje.push(event);
        return;
      }

      if (isThisWeek(start)) {
        semana.push(event);
        return;
      }

      proximos.push(event);
    });

    return { hoje, semana, proximos, automaticos };
  }, [events]);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[1200px] grid-cols-4 gap-5">
        <EventsBoardColumn
          title="Hoje"
          count={columns.hoje.length}
          events={columns.hoje}
        />

        <EventsBoardColumn
          title="Esta semana"
          count={columns.semana.length}
          events={columns.semana}
        />

        <EventsBoardColumn
          title="Próximos"
          count={columns.proximos.length}
          events={columns.proximos}
        />

        <EventsBoardColumn
          title="Automáticos"
          count={columns.automaticos.length}
          events={columns.automaticos}
        />
      </div>
    </div>
  );
}