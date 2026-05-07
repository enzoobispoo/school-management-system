"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Loader2 } from "lucide-react";
import { MiniCalendar } from "@/components/calendario/mini-calendar";
import { fetchCalendarEvents } from "@/lib/calendario/calendar-api";
import type { CalendarEvent } from "@/lib/calendario/calendar-types";
import {
  formatDateInput,
  getEventTypeLabel,
} from "@/lib/calendario/calendar-utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DocenteDashboardCalendar(props: {
  professorId: string;
  colorful?: boolean;
}) {
  const { professorId, colorful = false } = props;
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calLoading, setCalLoading] = useState(true);

  useEffect(() => {
    if (!professorId) {
      setEvents([]);
      setCalLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setCalLoading(true);
        const start = new Date();
        start.setDate(start.getDate() - 14);
        const end = new Date();
        end.setDate(end.getDate() + 56);
        const result = await fetchCalendarEvents(
          formatDateInput(start),
          formatDateInput(end),
          { professorId }
        );
        if (!cancelled) setEvents(result.data);
      } catch {
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setCalLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [professorId]);

  const eventDayKeys = useMemo(() => {
    const s = new Set<string>();
    for (const e of events) {
      s.add(formatDateInput(new Date(e.start)));
    }
    return s;
  }, [events]);

  const dayEvents = useMemo(() => {
    const key = formatDateInput(selectedDate);
    return [...events]
      .filter((e) => formatDateInput(new Date(e.start)) === key)
      .sort(
        (a, b) =>
          new Date(a.start).getTime() - new Date(b.start).getTime()
      );
  }, [events, selectedDate]);

  const selectedLabel = selectedDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <section className="relative space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Agenda
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Seus eventos e aulas agendadas — mesmo recorte do calendário escolar, filtrado para você.
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/calendario/eventos">
            Ver agenda completa
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div
        className={cn(
          "grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]",
          "rounded-2xl border p-4 shadow-sm backdrop-blur-md",
          colorful
            ? "border-violet-200/70 bg-violet-50/60 dark:border-violet-400/25 dark:bg-violet-500/10"
            : "border-border/55 bg-card/40 dark:border-white/[0.06] dark:bg-zinc-900/35"
        )}
      >
        <div className="relative">
          {calLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-background/60 backdrop-blur-[2px] dark:bg-background/40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : null}
          <MiniCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            daysWithEvents={eventDayKeys}
          />
        </div>

        <div
          className={cn(
            "flex min-h-[200px] flex-col rounded-2xl border p-4",
            colorful
              ? "border-white/45 bg-white/55 dark:border-white/15 dark:bg-white/5"
              : "border-border/50 bg-muted/15 dark:border-white/[0.06] dark:bg-zinc-950/25"
          )}
        >
          <div className="mb-3 flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            <span className="capitalize text-foreground/90">{selectedLabel}</span>
          </div>

          {dayEvents.length === 0 ? (
            <p className="flex flex-1 items-center text-sm text-muted-foreground">
              Nada agendado neste dia.
            </p>
          ) : (
            <ul className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
              {dayEvents.map((event) => {
                const start = new Date(event.start);
                return (
                  <li
                    key={event.id}
                    className={cn(
                      "rounded-xl border px-3 py-2.5",
                      colorful
                        ? "border-white/50 bg-white/70 dark:border-white/15 dark:bg-white/10"
                        : "border-border/55 bg-card/60 dark:border-white/[0.06]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {event.title}
                      </p>
                      <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {getEventTypeLabel(event)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {start.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {event.turma?.nome ? (
                        <>
                          {" "}
                          · {event.turma.nome}
                        </>
                      ) : null}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
