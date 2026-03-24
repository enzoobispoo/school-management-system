import type {
    CalendarEventPayload,
    CalendarResponse,
  } from "@/lib/calendario/calendar-types";
  
  export async function fetchCalendarEvents(start: string, end: string) {
    const params = new URLSearchParams();
    params.set("start", start);
    params.set("end", end);
  
    const response = await fetch(`/api/calendario?${params.toString()}`, {
      cache: "no-store",
    });
  
    const result: CalendarResponse = await response.json();
  
    if (!response.ok) {
      throw new Error("Falha ao carregar calendário");
    }
  
    return result;
  }
  
  export async function createCalendarEvent(payload: CalendarEventPayload) {
    const response = await fetch("/api/eventos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  
    const result = await response.json();
  
    if (!response.ok) {
      throw new Error(result.error || "Erro ao criar evento");
    }
  
    return result;
  }
  
  export async function updateCalendarEvent(
    id: string,
    payload: CalendarEventPayload
  ) {
    const response = await fetch(`/api/eventos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  
    const result = await response.json();
  
    if (!response.ok) {
      throw new Error(result.error || "Erro ao atualizar evento");
    }
  
    return result;
  }
  
  export async function deleteCalendarEvent(id: string) {
    const response = await fetch(`/api/eventos/${id}`, {
      method: "DELETE",
    });
  
    const result = await response.json();
  
    if (!response.ok) {
      throw new Error(result.error || "Erro ao excluir evento");
    }
  
    return result;
  }