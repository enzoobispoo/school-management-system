"use client";

import { useCallback } from "react";
import type { CalendarEventPayload } from "@/lib/calendario/calendar-types";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarEvents,
  updateCalendarEvent,
} from "@/lib/calendario/calendar-api";

interface UseCalendarActionsParams {
  weekStart: string;
  weekEnd: string;
  onLoadingChange: (value: boolean) => void;
  onErrorChange: (value: string) => void;
  onEventsChange: (events: any[]) => void;
}

export function useCalendarActions({
  weekStart,
  weekEnd,
  onLoadingChange,
  onErrorChange,
  onEventsChange,
}: UseCalendarActionsParams) {
  const fetchCalendar = useCallback(async () => {
    try {
      onLoadingChange(true);
      onErrorChange("");

      const result = await fetchCalendarEvents(weekStart, weekEnd);
      onEventsChange(result.data);
    } catch (err) {
      console.error(err);
      onErrorChange("Não foi possível carregar o calendário.");
    } finally {
      onLoadingChange(false);
    }
  }, [weekStart, weekEnd, onLoadingChange, onErrorChange, onEventsChange]);

  const handleCreateEvent = useCallback(
    async (payload: CalendarEventPayload) => {
      await createCalendarEvent(payload);
      await fetchCalendar();
    },
    [fetchCalendar]
  );

  const handleUpdateEvent = useCallback(
    async (id: string, payload: CalendarEventPayload) => {
      await updateCalendarEvent(id, payload);
      await fetchCalendar();
    },
    [fetchCalendar]
  );

  const handleDeleteEvent = useCallback(
    async (id: string) => {
      await deleteCalendarEvent(id);
      await fetchCalendar();
    },
    [fetchCalendar]
  );

  return {
    fetchCalendar,
    handleCreateEvent,
    handleUpdateEvent,
    handleDeleteEvent,
  };
}