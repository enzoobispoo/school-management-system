"use client";

import type { CalendarEvent } from "@/lib/calendario/calendar-types";
import { getEventTypeLabel } from "@/lib/calendario/calendar-utils";

interface EventsBoardCardProps {
  event: CalendarEvent;
}

function getCardClassName(event: CalendarEvent) {
  if (event.source === "automatic") {
    return "bg-[#efe9ff] dark:bg-[#2a223f]";
  }

  switch (event.type) {
    case "REUNIAO":
      return "bg-[#f3e4ff] dark:bg-[#2a1f3d]";
    case "PROVA":
      return "bg-[#fff08a] dark:bg-[#3a3600]";
    case "REPOSICAO":
      return "bg-[#e8f0ff] dark:bg-[#1e2a40]";
    case "FERIADO":
      return "bg-[#ffe6e0] dark:bg-[#3a1f1a]";
    case "LEMBRETE":
      return "bg-[#f4f4f5] dark:bg-[#2a2a2a]";
    default:
      return "bg-white dark:bg-[#1a1a1a]";
  }
}

export function EventsBoardCard({ event }: EventsBoardCardProps) {
  const start = new Date(event.start);

  return (
    <div
      className={`rounded-[26px] p-5 border border-black/5 dark:border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${getCardClassName(
        event
      )}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold leading-5 text-foreground">
            {event.title}
          </p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {getEventTypeLabel(event)}
          </p>
        </div>

        <span className="text-sm text-muted-foreground">•••</span>
      </div>

      <div className="mb-4 space-y-2">
        <div className="h-1.5 w-16 rounded-full bg-foreground/80" />
        <div className="h-1.5 w-24 rounded-full bg-foreground/30" />
      </div>

      <div className="space-y-1">
        {event.professor?.nome ? (
          <p className="text-sm font-medium text-foreground">
            {event.professor.nome}
          </p>
        ) : event.turma?.nome ? (
          <p className="text-sm font-medium text-foreground">
            {event.turma.nome}
          </p>
        ) : (
          <p className="text-sm font-medium text-foreground">
            Evento geral
          </p>
        )}

        <p className="text-xs text-muted-foreground">
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