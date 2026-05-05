"use client";

import { useEffect, useState } from "react";
import type { CalendarEvent } from "@/lib/calendario/calendar-types";
import { getEventColorVars, getEventTypeLabel } from "@/lib/calendario/calendar-utils";

interface EventsBoardCardProps {
  event: CalendarEvent;
}

export function EventsBoardCard({ event }: EventsBoardCardProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const vars = getEventColorVars(event) as Record<string, string>;
  const bg = isDark ? vars["--ev-bg-dark"] : vars["--ev-bg-light"];
  const border = isDark ? vars["--ev-border-dark"] : vars["--ev-border-light"];
  const color = isDark ? vars["--ev-text-dark"] : vars["--ev-text-light"];

  const start = new Date(event.start);

  return (
    <div
      className="rounded-[26px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      style={{ backgroundColor: bg, borderColor: border, borderWidth: 1, borderStyle: "solid", color }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold leading-5">
            {event.title}
          </p>
          <p className="mt-1 text-xs font-medium opacity-60">
            {getEventTypeLabel(event)}
          </p>
        </div>
        <span className="text-sm opacity-40">•••</span>
      </div>

      <div className="mb-4 space-y-2">
        <div className="h-1.5 w-16 rounded-full opacity-60" style={{ backgroundColor: color }} />
        <div className="h-1.5 w-24 rounded-full opacity-25" style={{ backgroundColor: color }} />
      </div>

      <div className="space-y-1">
        {event.professor?.nome ? (
          <p className="text-sm font-medium">{event.professor.nome}</p>
        ) : event.turma?.nome ? (
          <p className="text-sm font-medium">{event.turma.nome}</p>
        ) : (
          <p className="text-sm font-medium">Evento geral</p>
        )}
        <p className="text-xs opacity-60">
          {start.toLocaleDateString("pt-BR")} •{" "}
          {start.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
