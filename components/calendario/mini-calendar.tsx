"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateInput } from "@/lib/calendario/calendar-utils";

interface MiniCalendarProps {
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  /** Dias (yyyy-mm-dd) com algum compromisso — mostra um indicador discreto. */
  daysWithEvents?: Set<string>;
}

const WEEK_DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfCalendarGrid(date: Date) {
  const firstDay = startOfMonth(date);
  const day = firstDay.getDay();
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - day);
  return start;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function MiniCalendar({
  selectedDate = new Date(),
  onSelectDate,
  daysWithEvents,
}: MiniCalendarProps) {
  const [referenceDate, setReferenceDate] = useState(selectedDate);

  const days = useMemo(() => {
    const start = startOfCalendarGrid(referenceDate);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [referenceDate]);

  const currentMonth = referenceDate.getMonth();
  const today = new Date();

  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {referenceDate.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
          })}
        </h3>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl"
            onClick={() =>
              setReferenceDate(
                new Date(
                  referenceDate.getFullYear(),
                  referenceDate.getMonth() - 1,
                  1
                )
              )
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl"
            onClick={() =>
              setReferenceDate(
                new Date(
                  referenceDate.getFullYear(),
                  referenceDate.getMonth() + 1,
                  1
                )
              )
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEK_DAYS.map((day, index) => (
          <div
            key={`${day}-${index}`}
            className="flex h-8 items-center justify-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isTodayDate = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const isOutsideMonth = day.getMonth() !== currentMonth;

          const dayKey = formatDateInput(day);
          const hasMark = daysWithEvents?.has(dayKey) ?? false;

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDate?.(day)}
              className={[
                "relative flex h-9 w-9 items-center justify-center rounded-xl text-sm transition",
                isSelected
                  ? "bg-foreground text-background"
                  : isTodayDate
                  ? "border border-border bg-muted text-foreground"
                  : "text-foreground hover:bg-accent",
                isOutsideMonth ? "opacity-35" : "",
              ].join(" ")}
            >
              {day.getDate()}
              {hasMark ? (
                <span
                  aria-hidden
                  className={[
                    "absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full",
                    isSelected ? "bg-background" : "bg-primary",
                  ].join(" ")}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
