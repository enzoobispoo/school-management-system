"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { CalendarPageContent } from "@/components/calendario/calendar-page-content";
import { CalendarModals } from "@/components/calendario/calendar-modals";
import { useCalendarPage } from "@/hooks/calendario/use-calendar-page";

export default function CalendarioPage() {
  const calendar = useCalendarPage();

  return (
    <DashboardLayout>
      <Header title="Calendário" description="Agenda semanal da escola" />

      <CalendarPageContent
        referenceDate={calendar.referenceDate}
        setReferenceDate={calendar.setReferenceDate}
        weekStart={calendar.weekStart}
        weekDays={calendar.weekDays}
        filteredEvents={calendar.filteredEvents}
        loading={calendar.loading}
        error={calendar.error}
        eventFilter={calendar.eventFilter}
        setEventFilter={calendar.setEventFilter}
        openCreateModal={calendar.openCreateModal}
        openAdvancedFilters={calendar.openAdvancedFilters}
        hasAdvancedFilters={calendar.hasAdvancedFilters}
        handleCalendarClick={calendar.handleCalendarClick}
        openEventDetails={calendar.openEventDetails}
      />

      <CalendarModals
        selectedEvent={calendar.selectedEvent}
        newEventOpen={calendar.newEventOpen}
        editEventOpen={calendar.editEventOpen}
        detailsOpen={calendar.detailsOpen}
        deleteConfirmOpen={calendar.deleteConfirmOpen}
        advancedFiltersOpen={calendar.advancedFiltersOpen}
        creatingEvent={calendar.creatingEvent}
        updatingEvent={calendar.updatingEvent}
        deletingEvent={calendar.deletingEvent}
        initialStart={calendar.initialStart}
        initialEnd={calendar.initialEnd}
        editInitialData={calendar.editInitialData}
        advancedFilters={calendar.advancedFilters}
        advancedFiltersDraft={calendar.advancedFiltersDraft}
        setAdvancedFiltersDraft={calendar.setAdvancedFiltersDraft}
        setNewEventOpen={calendar.setNewEventOpen}
        setDetailsOpen={calendar.setDetailsOpen}
        setDeleteConfirmOpen={calendar.setDeleteConfirmOpen}
        setAdvancedFiltersOpen={calendar.setAdvancedFiltersOpen}
        closeEditModal={calendar.closeEditModal}
        openEditModal={calendar.openEditModal}
        openDeleteConfirm={calendar.openDeleteConfirm}
        applyAdvancedFilters={calendar.applyAdvancedFilters}
        clearAdvancedFilters={calendar.clearAdvancedFilters}
        submitCreateEvent={calendar.submitCreateEvent}
        submitEditEvent={calendar.submitEditEvent}
        confirmDeleteEvent={calendar.confirmDeleteEvent}
      />
    </DashboardLayout>
  );
}