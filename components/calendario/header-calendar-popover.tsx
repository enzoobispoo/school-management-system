"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { MiniCalendar } from "@/components/calendario/mini-calendar"
import { UpcomingEventsList } from "@/components/calendario/upcoming-events-list"
import type { CalendarEvent } from "@/lib/calendario/calendar-types"
import { fetchCalendarEvents } from "@/lib/calendario/calendar-api"
import { formatDateInput } from "@/lib/calendario/calendar-utils"

export function HeaderCalendarPopover() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])

  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter((event) => new Date(event.start) >= new Date())
      .sort(
        (a, b) =>
          new Date(a.start).getTime() - new Date(b.start).getTime()
      )
      .slice(0, 4)
  }, [events])

  useEffect(() => {
    async function loadEvents() {
      try {
        const today = new Date()
        const future = new Date()
        future.setDate(future.getDate() + 30)

        const result = await fetchCalendarEvents(
          formatDateInput(today),
          formatDateInput(future)
        )

        setEvents(result.data)
      } catch (error) {
        console.error("Erro ao carregar eventos do calendário:", error)
      }
    }

    loadEvents()
  }, [])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-2xl">
          <CalendarDays className="h-5 w-5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[380px] rounded-[28px] border border-black/5 bg-[#fafafa] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
      >
        <div className="space-y-4">
          <MiniCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          <UpcomingEventsList events={upcomingEvents} />

          <Link
            href="/calendario"
            className="block rounded-2xl bg-black px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-black/90"
          >
            Abrir calendário completo
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}