import { CalendarEvent } from "./calendar-types";

/** Layout horizontal quando vários eventos compartilham o mesmo intervalo de tempo. */
export type TimedEventLayout = { col: number; cols: number };

function eventsOverlap(a: CalendarEvent, b: CalendarEvent): boolean {
  const as = +new Date(a.start);
  const ae = +new Date(a.end);
  const bs = +new Date(b.start);
  const be = +new Date(b.end);
  return as < be && bs < ae;
}

/**
 * Agrupa eventos do mesmo dia que se interceptam e distribui em colunas (estilo agenda).
 */
export function layoutTimedEventsForDay(
  dayEvents: CalendarEvent[]
): Map<string, TimedEventLayout> {
  const result = new Map<string, TimedEventLayout>();
  if (dayEvents.length === 0) return result;

  const visited = new Set<number>();
  const clusters: number[][] = [];

  function dfs(i: number, acc: number[]) {
    visited.add(i);
    acc.push(i);
    for (let j = 0; j < dayEvents.length; j++) {
      if (visited.has(j)) continue;
      if (eventsOverlap(dayEvents[i], dayEvents[j])) dfs(j, acc);
    }
  }

  for (let i = 0; i < dayEvents.length; i++) {
    if (visited.has(i)) continue;
    const comp: number[] = [];
    dfs(i, comp);
    clusters.push(comp);
  }

  for (const comp of clusters) {
    const sortedIdx = [...comp].sort(
      (a, b) => +new Date(dayEvents[a].start) - +new Date(dayEvents[b].start)
    );

    const colEnd: number[] = [];

    for (const idx of sortedIdx) {
      const ev = dayEvents[idx];
      const s = +new Date(ev.start);
      const e = +new Date(ev.end);

      let col = -1;
      for (let c = 0; c < colEnd.length; c++) {
        if (colEnd[c] <= s) {
          col = c;
          break;
        }
      }
      if (col === -1) {
        col = colEnd.length;
        colEnd.push(e);
      } else {
        colEnd[col] = Math.max(colEnd[col], e);
      }

      result.set(ev.id, { col, cols: 0 });
    }

    const cols = Math.max(1, colEnd.length);
    for (const idx of comp) {
      const ev = dayEvents[idx];
      const cur = result.get(ev.id);
      if (cur) cur.cols = cols;
    }
  }

  return result;
}

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

// Paleta: [bgLight, borderLight, textLight, bgDark, borderDark, textDark]
const EVENT_COLORS: Record<string, [string, string, string, string, string, string]> = {
  automatic: ["#e9ecff", "#cfd7ff", "#2d3553", "rgba(59,91,219,0.35)", "rgba(129,140,248,0.55)", "#e0e7ff"],
  REUNIAO:   ["#f1e9ff", "#d9c8ff", "#4b3f66", "rgba(124,58,237,0.15)", "rgba(167,139,250,0.3)", "#c4b5fd"],
  PROVA:     ["#e8ebff", "#d7dcff", "#404b6b", "rgba(79,70,229,0.15)", "rgba(129,140,248,0.3)", "#a5b4fc"],
  FERIADO:   ["#ffe8e3", "#ffd5cd", "#6b4c46", "rgba(220,38,38,0.15)", "rgba(252,165,165,0.3)", "#fca5a5"],
  REPOSICAO: ["#e5f8ea", "#cdeed7", "#3d5e48", "rgba(16,185,129,0.15)", "rgba(110,231,183,0.3)", "#6ee7b7"],
  default:   ["#f5f5f5", "#e5e7eb", "#3f3f46", "rgba(100,100,100,0.15)", "rgba(150,150,150,0.3)", "#d4d4d8"],
};

function getEventKey(event: CalendarEvent): string {
  if (event.source === "automatic") return "automatic";
  return event.type ?? "default";
}

export function getEventColorVars(event: CalendarEvent): React.CSSProperties {
  const key = getEventKey(event);
  const [bgL, borderL, textL, bgD, borderD, textD] = EVENT_COLORS[key] ?? EVENT_COLORS.default;
  return {
    "--ev-bg-light": bgL,
    "--ev-border-light": borderL,
    "--ev-text-light": textL,
    "--ev-bg-dark": bgD,
    "--ev-border-dark": borderD,
    "--ev-text-dark": textD,
  } as React.CSSProperties;
}

// Classe estática que lê as CSS vars — Tailwind não precisa escanear
export const EVENT_CARD_CLASS =
  "border-[var(--ev-border-light)] bg-[var(--ev-bg-light)] text-[var(--ev-text-light)] dark:border-[var(--ev-border-dark)] dark:bg-[var(--ev-bg-dark)] dark:text-[var(--ev-text-dark)]";

/** @deprecated use getEventColorVars + EVENT_CARD_CLASS */
export function getEventClasses(event: CalendarEvent) {
  return EVENT_CARD_CLASS;
}

export function getEventTypeLabel(event: CalendarEvent) {
  if (event.source === "automatic") return "Aula";

  switch (event.type) {
    case "REUNIAO":   return "Reunião";
    case "PROVA":     return "Prova";
    case "REPOSICAO": return "Reposição";
    case "FERIADO":   return "Feriado";
    case "LEMBRETE":  return "Lembrete";
    default:          return "Geral";
  }
}

export function getEventBadgeClasses(event: CalendarEvent) {
  return EVENT_CARD_CLASS;
}
