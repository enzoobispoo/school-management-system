"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { EventsPageContent } from "@/components/calendario/events-page-content";
import { useCalendarEventsPage } from "@/hooks/calendario/use-calendar-events-page";

export default function CalendarioEventosPage() {
  const eventsPage = useCalendarEventsPage();

  return (
    <DashboardLayout>
      <Header
        title="Calendário"
        description="Lista completa de eventos agendados"
      />

      <EventsPageContent
        loading={eventsPage.loading}
        error={eventsPage.error}
        search={eventsPage.search}
        setSearch={eventsPage.setSearch}
        eventFilter={eventsPage.eventFilter}
        setEventFilter={eventsPage.setEventFilter}
        filteredEvents={eventsPage.filteredEvents}
      />
    </DashboardLayout>
  );
}