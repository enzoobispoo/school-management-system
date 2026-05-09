"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { CalendarEvent } from "@/lib/calendario/calendar-types";
import {
  getEventColorVars,
  getEventStyle,
  getEventTypeLabel,
  type TimedEventLayout,
} from "@/lib/calendario/calendar-utils";

interface Props {
  event: CalendarEvent;
  /** Distribuição horizontal quando há sobreposição de horários no mesmo dia. */
  layout?: TimedEventLayout;
  onClick?: (event: CalendarEvent) => void;
}

export function CalendarEventCard({ event, layout, onClick }: Props) {
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

  const cols = layout && layout.cols > 1 ? layout.cols : 1;
  const col = layout?.col ?? 0;

  const columnStyle: CSSProperties =
    cols <= 1 ?
      { left: "8px", width: "calc(100% - 16px)", right: "auto", zIndex: 5 }
    : {
        left: `calc(${col} * (100% / ${cols}) + 4px)`,
        width: `calc(100% / ${cols} - 8px)`,
        right: "auto",
        zIndex: 10 + col,
      };

  return (
    <div
      onClick={() => onClick?.(event)}
      className="isolate cursor-pointer overflow-hidden rounded-[14px] border px-2.5 py-1.5 shadow-sm backdrop-blur-[2px] transition hover:brightness-[1.03] hover:saturate-[1.02]"
      style={{
        ...posStyle,
        ...columnStyle,
        backgroundColor: bg,
        borderColor: border,
        color,
        contain: "layout paint",
      }}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="line-clamp-3 text-[12px] font-semibold leading-tight">{event.title}</p>
        <span className="shrink-0 text-[10px] opacity-45">⋯</span>
      </div>

      <p className="text-[10px] font-medium leading-tight opacity-80">
        {typeLabel} · {startText}–{endText}
      </p>

      {event.turma?.nome ?
        <p className="mt-1 line-clamp-2 text-[10px] font-medium opacity-75">{event.turma.nome}</p>
      : null}
    </div>
  );
}
