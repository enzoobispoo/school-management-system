"use client";

import { useState } from "react";
import type { CalendarEvent } from "@/lib/calendario/calendar-types";

export function useCalendarState() {
  const [referenceDate, setReferenceDate] = useState(new Date());

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const [newEventOpen, setNewEventOpen] = useState(false);
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  const [creatingEvent, setCreatingEvent] = useState(false);
  const [updatingEvent, setUpdatingEvent] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);

  const [initialStart, setInitialStart] = useState<string | undefined>();
  const [initialEnd, setInitialEnd] = useState<string | undefined>();

  return {
    referenceDate,
    setReferenceDate,

    selectedEvent,
    setSelectedEvent,

    newEventOpen,
    setNewEventOpen,
    editEventOpen,
    setEditEventOpen,
    detailsOpen,
    setDetailsOpen,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    advancedFiltersOpen,
    setAdvancedFiltersOpen,

    creatingEvent,
    setCreatingEvent,
    updatingEvent,
    setUpdatingEvent,
    deletingEvent,
    setDeletingEvent,

    initialStart,
    setInitialStart,
    initialEnd,
    setInitialEnd,
  };
}