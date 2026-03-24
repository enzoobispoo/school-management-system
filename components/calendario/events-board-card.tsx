"use client";

import type { CalendarEvent } from "@/lib/calendario/calendar-types";
import { getEventTypeLabel } from "@/lib/calendario/calendar-utils";

interface EventsBoardCardProps {
  event: CalendarEvent;
}

function getCardClassName(event: CalendarEvent) {
  if (event.source === "automatic") {
    return "bg-[#efe9ff]";
  }

  switch (event.type) {
    case "REUNIAO":
      return "bg-[#f3e4ff]";
    case "PROVA":
      return "bg-[#fff08a]";
    case "REPOSICAO":
      return "bg-[#e8f0ff]";
    case "FERIADO":
      return "bg-[#ffe6e0]";
    case "LEMBRETE":
      return "bg-[#f4f4f5]";
    default:
      return "bg-white";
  }
}

export function EventsBoardCard({ event }: EventsBoardCardProps) {
  const start = new Date(event.start);

  return (
    <div
      className={`rounded-[26px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${getCardClassName(
        event
      )}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold leading-5 text-black">
            {event.title}
          </p>
          <p className="mt-1 text-xs font-medium text-black/55">
            {getEventTypeLabel(event)}
          </p>
        </div>

        <span className="text-sm text-black/40">•••</span>
      </div>

      <div className="mb-4 space-y-2">
        <div className="h-1.5 w-16 rounded-full bg-black" />
        <div className="h-1.5 w-24 rounded-full bg-black/20" />
      </div>

      <div className="space-y-1">
        {event.professor?.nome ? (
          <p className="text-sm font-medium text-black">{event.professor.nome}</p>
        ) : event.turma?.nome ? (
          <p className="text-sm font-medium text-black">{event.turma.nome}</p>
        ) : (
          <p className="text-sm font-medium text-black">Evento geral</p>
        )}

        <p className="text-xs text-black/60">
          {start.toLocaleDateString("pt-BR")} •{" "}
          {start.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}