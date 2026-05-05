"use client";

import { useEffect, useState } from "react";
import type { CalendarEvent } from "@/lib/calendario/calendar-types";
import { getEventColorVars, getEventStyle, getEventTypeLabel } from "@/lib/calendario/calendar-utils";

interface Props {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
}

export function CalendarEventCard({ event, onClick }: Props) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const start = new Date(event.start);
  const end = new Date(event.end);
  const posStyle = getEventStyle(start, end);
  const vars = getEventColorVars(event) as Record<string, string>;
  const typeLabel = getEventTypeLabel(event);

  const startText = start.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const endText = end.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const bg     = isDark ? vars["--ev-bg-dark"]     : vars["--ev-bg-light"];
  const border = isDark ? vars["--ev-border-dark"]  : vars["--ev-border-light"];
  const color  = isDark ? vars["--ev-text-dark"]    : vars["--ev-text-light"];

  return (
    <div
      onClick={() => onClick?.(event)}
      className="absolute left-2 right-2 cursor-pointer rounded-[18px] border px-3 py-2 shadow-none transition hover:opacity-90"
      style={{ ...posStyle, backgroundColor: bg, borderColor: border, color }}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-[13px] font-semibold leading-4">{event.title}</p>
        <span className="text-[11px] opacity-50">•••</span>
      </div>

      <p className="text-[11px] font-medium opacity-70">
        {typeLabel} • {startText} - {endText}
      </p>

      {event.turma?.nome && (
        <p className="mt-1 text-[11px] font-medium opacity-70">{event.turma.nome}</p>
      )}
    </div>
  );
}
