"use client";

import type { CalendarEvent } from "@/lib/calendario/calendar-types";
import { getEventTypeLabel } from "@/lib/calendario/calendar-utils";
import { CalendarDays, Clock3, GraduationCap, User, Users } from "lucide-react";

interface EventsListProps {
  events: CalendarEvent[];
}

export function EventsList({ events }: EventsListProps) {
  if (!events.length) {
    return (
      <div className="rounded-[28px] border border-black/5 bg-white p-10 text-sm text-muted-foreground">
        Nenhum evento encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        const start = new Date(event.start);
        const end = new Date(event.end);

        return (
          <div
            key={event.id}
            className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-black">
                  {event.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {getEventTypeLabel(event)}
                </p>
              </div>

              <span className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs font-medium text-black">
                {event.source === "automatic" ? "Automático" : "Manual"}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-[#f7f7f8] p-4">
                <div className="mb-2 flex items-center gap-2 text-[#6b7280]">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Data
                  </span>
                </div>
                <p className="text-sm font-medium text-black">
                  {start.toLocaleDateString("pt-BR")}
                </p>
              </div>

              <div className="rounded-2xl bg-[#f7f7f8] p-4">
                <div className="mb-2 flex items-center gap-2 text-[#6b7280]">
                  <Clock3 className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Horário
                  </span>
                </div>
                <p className="text-sm font-medium text-black">
                  {start.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {end.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="rounded-2xl bg-[#f7f7f8] p-4">
                <div className="mb-2 flex items-center gap-2 text-[#6b7280]">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Turma
                  </span>
                </div>
                <p className="text-sm font-medium text-black">
                  {event.turma?.nome || "—"}
                </p>
              </div>

              <div className="rounded-2xl bg-[#f7f7f8] p-4">
                <div className="mb-2 flex items-center gap-2 text-[#6b7280]">
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Curso
                  </span>
                </div>
                <p className="text-sm font-medium text-black">
                  {event.curso?.nome || "—"}
                </p>
              </div>
            </div>

            {(event.professor || event.description) && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {event.professor && (
                  <div className="rounded-2xl border border-black/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-[#6b7280]">
                      <User className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Professor
                      </span>
                    </div>
                    <p className="text-sm font-medium text-black">
                      {event.professor.nome}
                    </p>
                  </div>
                )}

                {event.description && (
                  <div className="rounded-2xl border border-black/5 p-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                      Descrição
                    </p>
                    <p className="text-sm text-black">{event.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}