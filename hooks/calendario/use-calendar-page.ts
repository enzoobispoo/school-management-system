"use client";

import { useEffect, useMemo, useState } from "react";
import type { CalendarEventPayload, CalendarEventType } from "@/lib/calendario/calendar-types";
import {
  addDays,
  endOfWeek,
  formatDateInput,
  formatDateTimeLocal,
  startOfWeek,
} from "@/lib/calendario/calendar-utils";
import { useCalendarState } from "@/hooks/calendario/use-calendar-state";
import { useCalendarFilters } from "@/hooks/calendario/use-calendar-filters";
import { useCalendarActions } from "@/hooks/calendario/use-calendar-actions";

export function useCalendarPage() {
  const state = useCalendarState();
  const [events, setEvents] = useState(state.selectedEvent ? [state.selectedEvent] : []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const weekStartDate = useMemo(
    () => startOfWeek(state.referenceDate),
    [state.referenceDate]
  );
  const weekEndDate = useMemo(
    () => endOfWeek(state.referenceDate),
    [state.referenceDate]
  );

  const weekStart = formatDateInput(weekStartDate);
  const weekEnd = formatDateInput(weekEndDate);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i)),
    [weekStartDate]
  );

  const filters = useCalendarFilters(events);

  const actions = useCalendarActions({
    weekStart,
    weekEnd,
    onLoadingChange: setLoading,
    onErrorChange: setError,
    onEventsChange: setEvents,
  });

  function handleCalendarClick(day: Date, hour: number) {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);

    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    state.setInitialStart(formatDateTimeLocal(start));
    state.setInitialEnd(formatDateTimeLocal(end));
    state.setNewEventOpen(true);
  }

  function openEventDetails(event: (typeof events)[number]) {
    state.setSelectedEvent(event);
    state.setDetailsOpen(true);
  }

  function openCreateModal() {
    state.setInitialStart(undefined);
    state.setInitialEnd(undefined);
    state.setNewEventOpen(true);
  }

  function openEditModal() {
    if (!state.selectedEvent || state.selectedEvent.source === "automatic") return;
    state.setDetailsOpen(false);
    state.setEditEventOpen(true);
  }

  function openDeleteConfirm() {
    if (!state.selectedEvent || state.selectedEvent.source === "automatic") return;
    state.setDeleteConfirmOpen(true);
  }

  function openAdvancedFilters() {
    filters.setAdvancedFiltersDraft(filters.advancedFilters);
    state.setAdvancedFiltersOpen(true);
  }

  function applyAdvancedFilters() {
    filters.applyAdvancedFilters();
    state.setAdvancedFiltersOpen(false);
  }

  function clearAdvancedFilters() {
    filters.clearAdvancedFilters();
  }

  function closeEditModal(open: boolean) {
    state.setEditEventOpen(open);
    if (!open) {
      state.setSelectedEvent(null);
    }
  }

  async function submitCreateEvent(payload: CalendarEventPayload) {
    try {
      state.setCreatingEvent(true);
      await actions.handleCreateEvent(payload);
      state.setNewEventOpen(false);
    } finally {
      state.setCreatingEvent(false);
    }
  }

  async function submitEditEvent(payload: CalendarEventPayload) {
    if (!state.selectedEvent || state.selectedEvent.source === "automatic") return;

    try {
      state.setUpdatingEvent(true);
      await actions.handleUpdateEvent(state.selectedEvent.id, payload);
      state.setEditEventOpen(false);
      state.setSelectedEvent(null);
    } finally {
      state.setUpdatingEvent(false);
    }
  }

  async function confirmDeleteEvent() {
    if (!state.selectedEvent || state.selectedEvent.source === "automatic") return;

    try {
      state.setDeletingEvent(true);
      await actions.handleDeleteEvent(state.selectedEvent.id);
      state.setDeleteConfirmOpen(false);
      state.setDetailsOpen(false);
      state.setSelectedEvent(null);
    } finally {
      state.setDeletingEvent(false);
    }
  }

  const editInitialData = state.selectedEvent
    ? {
        titulo: state.selectedEvent.title,
        descricao: state.selectedEvent.description ?? "",
        tipo:
          state.selectedEvent.source === "automatic"
            ? ("GERAL" as CalendarEventType)
            : (state.selectedEvent.type as CalendarEventType),
        dataInicio: state.selectedEvent.start.slice(0, 16),
        dataFim: state.selectedEvent.end.slice(0, 16),
        local: state.selectedEvent.location ?? "",
      }
    : null;

  useEffect(() => {
    actions.fetchCalendar();
  }, [actions.fetchCalendar]);

  return {
    referenceDate: state.referenceDate,
    setReferenceDate: state.setReferenceDate,
    weekStart: weekStartDate,
    weekEnd: weekEndDate,
    weekDays,

    events,
    filteredEvents: filters.filteredEvents,
    loading,
    error,

    eventFilter: filters.eventFilter,
    setEventFilter: filters.setEventFilter,

    advancedFilters: filters.advancedFilters,
    advancedFiltersDraft: filters.advancedFiltersDraft,
    setAdvancedFiltersDraft: filters.setAdvancedFiltersDraft,
    hasAdvancedFilters: filters.hasAdvancedFilters,

    selectedEvent: state.selectedEvent,
    detailsOpen: state.detailsOpen,
    setDetailsOpen: state.setDetailsOpen,

    newEventOpen: state.newEventOpen,
    editEventOpen: state.editEventOpen,
    deleteConfirmOpen: state.deleteConfirmOpen,
    advancedFiltersOpen: state.advancedFiltersOpen,

    creatingEvent: state.creatingEvent,
    updatingEvent: state.updatingEvent,
    deletingEvent: state.deletingEvent,

    initialStart: state.initialStart,
    initialEnd: state.initialEnd,
    editInitialData,

    openEventDetails,
    openCreateModal,
    openEditModal,
    openDeleteConfirm,
    openAdvancedFilters,
    applyAdvancedFilters,
    clearAdvancedFilters,
    closeEditModal,
    handleCalendarClick,

    setNewEventOpen: state.setNewEventOpen,
    setDeleteConfirmOpen: state.setDeleteConfirmOpen,
    setAdvancedFiltersOpen: state.setAdvancedFiltersOpen,

    submitCreateEvent,
    submitEditEvent,
    confirmDeleteEvent,
  };
}