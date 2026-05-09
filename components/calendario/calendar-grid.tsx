"use client";

import { CalendarEvent } from "@/lib/calendario/calendar-types";
import {
  HOURS,
  WEEK_DAYS,
  isSameDay,
  layoutTimedEventsForDay,
} from "@/lib/calendario/calendar-utils";
import { CalendarEventCard } from "./calendar-event-card";

interface Props {
  weekDays: Date[];
  events: CalendarEvent[];
  onSlotClick: (day: Date, hour: number) => void;
  onDayClick?: (day: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function CalendarGrid({
  weekDays,
  events,
  onSlotClick,
  onDayClick,
  onEventClick,
}: Props) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="grid grid-cols-[78px_repeat(7,minmax(0,1fr))] border-b border-border bg-card">
        <div className="border-r border-border p-3" />

        {weekDays.map((day) => {
          const today = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className="cursor-pointer border-r border-border px-4 py-3 last:border-r-0 hover:bg-muted/30 transition-colors"
              onClick={() => onDayClick?.(day)}
              title="Criar evento neste dia"
            >
              <div className="text-xs font-medium text-muted-foreground">
                {day.getDate()} - {WEEK_DAYS[day.getDay()]}
              </div>

              <div
                className={`mt-2 h-1 w-12 rounded-full ${
                  today ? "bg-foreground" : "bg-transparent"
                }`}
              />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-[78px_repeat(7,minmax(0,1fr))]">
        <div className="border-r border-border bg-card">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-20 border-b border-border px-3 pt-2 text-xs font-medium text-muted-foreground"
            >
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {weekDays.map((day) => {
          const dayEvents = events.filter((event) => {
            const start = new Date(event.start);
            return isSameDay(start, day) && !event.allDay;
          });

          const layouts = layoutTimedEventsForDay(dayEvents);

          return (
            <div
              key={day.toISOString()}
              className="relative isolate border-r border-border last:border-r-0"
              style={{ height: `${HOURS.length * 80}px` }}
            >
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  onClick={() => onSlotClick(day, hour)}
                  className="h-20 cursor-pointer border-b border-border transition hover:bg-muted/30"
                />
              ))}

              {dayEvents.map((event) => (
                <CalendarEventCard
                  key={event.id}
                  event={event}
                  layout={layouts.get(event.id)}
                  onClick={onEventClick}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}