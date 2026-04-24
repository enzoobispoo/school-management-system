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
      <div className="rounded-[28px] border border-border bg-card p-10 text-sm text-muted-foreground">
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
            className="rounded-[28px] border border-border bg-card p-5 text-card-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {event.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {getEventTypeLabel(event)}
                </p>
              </div>

              <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground">
                {event.source === "automatic" ? "Automático" : "Manual"}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-muted/40 p-4">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Data
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {start.toLocaleDateString("pt-BR")}
                </p>
              </div>

              <div className="rounded-2xl bg-muted/40 p-4">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Clock3 className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Horário
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">
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

              <div className="rounded-2xl bg-muted/40 p-4">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Turma
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {event.turma?.nome || "—"}
                </p>
              </div>

              <div className="rounded-2xl bg-muted/40 p-4">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Curso
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {event.curso?.nome || "—"}
                </p>
              </div>
            </div>

            {(event.professor || event.description) && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {event.professor && (
                  <div className="rounded-2xl border border-border p-4">
                    <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Professor
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {event.professor.nome}
                    </p>
                  </div>
                )}

                {event.description && (
                  <div className="rounded-2xl border border-border p-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Descrição
                    </p>
                    <p className="text-sm text-foreground">{event.description}</p>
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