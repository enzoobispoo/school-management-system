"use client";

import { CalendarEvent } from "@/lib/calendario/calendar-types";
import { HOURS, WEEK_DAYS, isSameDay } from "@/lib/calendario/calendar-utils";
import { CalendarEventCard } from "./calendar-event-card";

interface Props {
  weekDays: Date[];
  events: CalendarEvent[];
  onSlotClick: (day: Date, hour: number) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function CalendarGrid({
  weekDays,
  events,
  onSlotClick,
  onEventClick,
}: Props) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* HEADER */}
      <div className="grid grid-cols-[78px_repeat(7,minmax(0,1fr))] border-b border-black/5 bg-white">
        <div className="border-r border-black/5 p-3" />

        {weekDays.map((day) => {
          const today = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className="border-r border-black/5 px-4 py-3 last:border-r-0"
            >
              <div className="text-xs font-medium text-[#8a8f98]">
                {day.getDate()} - {WEEK_DAYS[day.getDay()]}
              </div>

              <div
                className={`mt-2 h-1 w-12 rounded-full ${
                  today ? "bg-black" : "bg-transparent"
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* BODY */}
      <div className="grid grid-cols-[78px_repeat(7,minmax(0,1fr))]">
        {/* HOURS */}
        <div className="border-r border-black/5 bg-white">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-20 border-b border-black/5 px-3 pt-2 text-xs font-medium text-[#8a8f98]"
            >
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* DAYS */}
        {weekDays.map((day) => {
          const dayEvents = events.filter((event) => {
            const start = new Date(event.start);
            return isSameDay(start, day) && !event.allDay;
          });

          return (
            <div
              key={day.toISOString()}
              className="relative border-r border-black/5 last:border-r-0"
              style={{ height: `${HOURS.length * 80}px` }}
            >
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  onClick={() => onSlotClick(day, hour)}
                  className="h-20 cursor-pointer border-b border-black/5 transition hover:bg-black/[0.015]"
                />
              ))}

              {dayEvents.map((event) => (
                <CalendarEventCard
                  key={event.id}
                  event={event}
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