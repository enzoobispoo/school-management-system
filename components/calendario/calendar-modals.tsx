"use client";

import { NewEventModal } from "@/components/calendario/new-event-modal";
import { CalendarEventDetailsModal } from "@/components/calendario/calendar-event-details-modal";
import {
  CalendarAdvancedFilters,
  type CalendarAdvancedFiltersState,
} from "@/components/calendario/calendar-advanced-filters";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type {
  CalendarEvent,
  CalendarEventInitialData,
  CalendarEventPayload,
} from "@/lib/calendario/calendar-types";

interface CalendarModalsProps {
  selectedEvent: CalendarEvent | null;

  newEventOpen: boolean;
  editEventOpen: boolean;
  detailsOpen: boolean;
  deleteConfirmOpen: boolean;
  advancedFiltersOpen: boolean;

  creatingEvent: boolean;
  updatingEvent: boolean;
  deletingEvent: boolean;

  initialStart?: string;
  initialEnd?: string;
  editInitialData: CalendarEventInitialData | null;

  advancedFilters: CalendarAdvancedFiltersState;
  advancedFiltersDraft: CalendarAdvancedFiltersState;
  setAdvancedFiltersDraft: (value: CalendarAdvancedFiltersState) => void;

  setNewEventOpen: (open: boolean) => void;
  setDetailsOpen: (open: boolean) => void;
  setDeleteConfirmOpen: (open: boolean) => void;
  setAdvancedFiltersOpen: (open: boolean) => void;
  closeEditModal: (open: boolean) => void;

  openEditModal: () => void;
  openDeleteConfirm: () => void;
  applyAdvancedFilters: () => void;
  clearAdvancedFilters: () => void;

  submitCreateEvent: (payload: CalendarEventPayload) => Promise<void>;
  submitEditEvent: (payload: CalendarEventPayload) => Promise<void>;
  confirmDeleteEvent: () => Promise<void>;
}

export function CalendarModals({
  selectedEvent,
  newEventOpen,
  editEventOpen,
  detailsOpen,
  deleteConfirmOpen,
  advancedFiltersOpen,
  creatingEvent,
  updatingEvent,
  deletingEvent,
  initialStart,
  initialEnd,
  editInitialData,
  advancedFilters,
  advancedFiltersDraft,
  setAdvancedFiltersDraft,
  setNewEventOpen,
  setDetailsOpen,
  setDeleteConfirmOpen,
  setAdvancedFiltersOpen,
  closeEditModal,
  openEditModal,
  openDeleteConfirm,
  applyAdvancedFilters,
  clearAdvancedFilters,
  submitCreateEvent,
  submitEditEvent,
  confirmDeleteEvent,
}: CalendarModalsProps) {
  return (
    <>
      <NewEventModal
        open={newEventOpen}
        onOpenChange={setNewEventOpen}
        loading={creatingEvent}
        initialStart={initialStart}
        initialEnd={initialEnd}
        onSubmit={submitCreateEvent}
      />

      <CalendarEventDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        event={selectedEvent}
        deleting={deletingEvent}
        onEdit={openEditModal}
        onDelete={openDeleteConfirm}
      />

      <NewEventModal
        mode="edit"
        open={editEventOpen}
        onOpenChange={closeEditModal}
        loading={updatingEvent}
        initialData={editInitialData}
        onSubmit={submitEditEvent}
      />

      <CalendarAdvancedFilters
        open={advancedFiltersOpen}
        onOpenChange={setAdvancedFiltersOpen}
        value={advancedFilters}
        draft={advancedFiltersDraft}
        onDraftChange={setAdvancedFiltersDraft}
        onApply={applyAdvancedFilters}
        onClear={clearAdvancedFilters}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Excluir evento"
        description={
          selectedEvent
            ? `Tem certeza que deseja excluir o evento "${selectedEvent.title}"? Essa ação não poderá ser desfeita.`
            : "Tem certeza que deseja excluir este evento?"
        }
        confirmLabel="Excluir"
        variant="destructive"
        loading={deletingEvent}
        onConfirm={confirmDeleteEvent}
      />
    </>
  );
}