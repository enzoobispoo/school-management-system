export interface CalendarEvent {
    id: string;
    source: "manual" | "automatic";
    title: string;
    description?: string | null;
    type: string;
    start: string;
    end: string;
    allDay: boolean;
    color?: string | null;
    location?: string | null;
    professor: { id: string; nome: string } | null;
    turma: { id: string; nome: string } | null;
    curso: { id: string; nome: string; categoria: string } | null;
  }
  
  export interface CalendarResponse {
    data: CalendarEvent[];
    meta: {
      start: string;
      end: string;
      total: number;
      manualCount: number;
      automaticCount: number;
    };
  }
  
  export type EventFilter =
    | "ALL"
    | "AULA"
    | "REUNIAO"
    | "PROVA"
    | "REPOSICAO"
    | "FERIADO"
    | "LEMBRETE";
  
  export type CalendarEventType =
    | "GERAL"
    | "REUNIAO"
    | "PROVA"
    | "REPOSICAO"
    | "FERIADO"
    | "LEMBRETE";
  
  export interface CalendarEventPayload {
    titulo: string;
    descricao?: string;
    tipo: CalendarEventType;
    dataInicio: string;
    dataFim: string;
    diaInteiro?: boolean;
    local?: string;
  }
  
  export interface CalendarEventInitialData {
    titulo?: string;
    descricao?: string;
    tipo?: CalendarEventType;
    dataInicio?: string;
    dataFim?: string;
    local?: string;
  }