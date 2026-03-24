"use client";

import { useEffect, useMemo, useState } from "react";
import type { CalendarEvent, EventFilter } from "@/lib/calendario/calendar-types";
import { fetchCalendarEvents } from "@/lib/calendario/calendar-api";
import { formatDateInput } from "@/lib/calendario/calendar-utils";

export function useCalendarEventsPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [eventFilter, setEventFilter] = useState<EventFilter>("ALL");
  const [search, setSearch] = useState("");

  const today = useMemo(() => new Date(), []);
  const ninetyDaysLater = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d;
  }, []);

  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((event) => {
        return (
          event.title.toLowerCase().includes(q) ||
          event.description?.toLowerCase().includes(q) ||
          event.professor?.nome.toLowerCase().includes(q) ||
          event.turma?.nome.toLowerCase().includes(q) ||
          event.curso?.nome.toLowerCase().includes(q)
        );
      });
    }

    if (eventFilter !== "ALL") {
      result = result.filter((event) => {
        if (eventFilter === "AULA") {
          return event.source === "automatic" || event.type === "AULA";
        }

        return event.type === eventFilter;
      });
    }

    return result.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }, [events, search, eventFilter]);

  async function fetchEvents() {
    try {
      setLoading(true);
      setError("");

      const result = await fetchCalendarEvents(
        formatDateInput(today),
        formatDateInput(ninetyDaysLater)
      );

      setEvents(result.data);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os eventos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    filteredEvents,
    loading,
    error,
    search,
    setSearch,
    eventFilter,
    setEventFilter,
    refreshEvents: fetchEvents,
  };
}