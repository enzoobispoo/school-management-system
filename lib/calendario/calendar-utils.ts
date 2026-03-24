import { CalendarEvent } from "./calendar-types";

export const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);

export function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfWeek(date: Date) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function formatDateTimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatWeekRange(start: Date) {
  const end = addDays(start, 6);
  const startDay = String(start.getDate()).padStart(2, "0");
  const endDay = String(end.getDate()).padStart(2, "0");
  const month = start.toLocaleDateString("pt-BR", { month: "long" });
  const year = start.getFullYear();

  return `${startDay}-${endDay} ${
    month.charAt(0).toUpperCase() + month.slice(1)
  } ${year}`;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function minutesFromMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function getEventStyle(start: Date, end: Date) {
  const calendarStart = 6 * 60;
  const startMinutes = minutesFromMidnight(start);
  const endMinutes = minutesFromMidnight(end);

  const top = ((startMinutes - calendarStart) / 60) * 80;
  const height = Math.max(((endMinutes - startMinutes) / 60) * 80, 52);

  return {
    top: `${top}px`,
    height: `${height}px`,
  };
}

export function getEventClasses(event: CalendarEvent) {
  if (event.source === "automatic") {
    return "border-[#cfd7ff] bg-[#e9ecff] text-[#2d3553]";
  }

  switch (event.type) {
    case "REUNIAO":
      return "border-[#d9c8ff] bg-[#f1e9ff] text-[#4b3f66]";
    case "PROVA":
      return "border-[#d7dcff] bg-[#e8ebff] text-[#404b6b]";
    case "FERIADO":
      return "border-[#ffd5cd] bg-[#ffe8e3] text-[#6b4c46]";
    case "REPOSICAO":
      return "border-[#cdeed7] bg-[#e5f8ea] text-[#3d5e48]";
    default:
      return "border-[#e5e7eb] bg-[#f5f5f5] text-[#3f3f46]";
  }
}

export function getEventTypeLabel(event: CalendarEvent) {
  if (event.source === "automatic") return "Aula";

  switch (event.type) {
    case "REUNIAO":
      return "Reunião";
    case "PROVA":
      return "Prova";
    case "REPOSICAO":
      return "Reposição";
    case "FERIADO":
      return "Feriado";
    case "LEMBRETE":
      return "Lembrete";
    default:
      return "Geral";
  }
}

export function getEventBadgeClasses(event: CalendarEvent) {
  if (event.source === "automatic") {
    return "border-[#cfd7ff] bg-[#e9ecff] text-[#2d3553]";
  }

  switch (event.type) {
    case "REUNIAO":
      return "border-[#d9c8ff] bg-[#f1e9ff] text-[#4b3f66]";
    case "PROVA":
      return "border-[#d7dcff] bg-[#e8ebff] text-[#404b6b]";
    case "FERIADO":
      return "border-[#ffd5cd] bg-[#ffe8e3] text-[#6b4c46]";
    case "REPOSICAO":
      return "border-[#cdeed7] bg-[#e5f8ea] text-[#3d5e48]";
    case "LEMBRETE":
      return "border-[#e5e7eb] bg-[#f5f5f5] text-[#3f3f46]";
    default:
      return "border-[#e5e7eb] bg-[#f5f5f5] text-[#3f3f46]";
  }
}