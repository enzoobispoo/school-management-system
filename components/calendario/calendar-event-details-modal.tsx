"use client";

import { CalendarEvent } from "@/lib/calendario/calendar-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CalendarDays,
  Clock3,
  GraduationCap,
  MapPin,
  User,
  Users,
} from "lucide-react";

interface CalendarEventDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}

function getEventTypeLabel(event: CalendarEvent) {
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

function getEventBadgeClasses(event: CalendarEvent) {
  if (event.source === "automatic") {
    return "border-[#cfd7ff]/30 bg-[#e9ecff]/10 text-white/85";
  }

  switch (event.type) {
    case "REUNIAO":
      return "border-[#d9c8ff]/30 bg-[#f1e9ff]/10 text-white/85";
    case "PROVA":
      return "border-[#d7dcff]/30 bg-[#e8ebff]/10 text-white/85";
    case "FERIADO":
      return "border-[#ffd5cd]/30 bg-[#ffe8e3]/10 text-white/85";
    case "REPOSICAO":
      return "border-[#cdeed7]/30 bg-[#e5f8ea]/10 text-white/85";
    case "LEMBRETE":
      return "border-border bg-muted/50 text-foreground";
    default:
      return "border-border bg-muted/50 text-foreground";
  }
}

export function CalendarEventDetailsModal({
  open,
  onOpenChange,
  event,
  onEdit,
  onDelete,
  deleting = false,
}: CalendarEventDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-[28px] border border-border bg-card p-0 text-card-foreground shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:max-w-[640px]">
        {event && (
          <>
            <DialogHeader className="border-b border-border bg-card px-7 py-6 text-left">
              <div className="flex items-start justify-between gap-4 pr-8">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md ${getEventBadgeClasses(
                        event
                      )}`}
                    >
                      {getEventTypeLabel(event)}
                    </span>

                    {event.source === "automatic" && (
                      <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                        Automático
                      </span>
                    )}
                  </div>

                  <DialogTitle className="text-[26px] font-semibold tracking-[-0.03em] text-foreground">
                    {event.title}
                  </DialogTitle>

                  <DialogDescription className="mt-2 text-sm text-muted-foreground">
                    Detalhes do evento selecionado
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 px-7 py-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-muted/40 p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      Data
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(event.start).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/40 p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      Horário
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(event.start).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(event.end).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {event.description && (
                <div className="rounded-2xl border border-border p-5">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Descrição
                  </p>
                  <p className="text-sm leading-6 text-foreground">
                    {event.description}
                  </p>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                {event.professor && (
                  <div className="rounded-2xl border border-border p-5">
                    <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Professor
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {event.professor.nome}
                    </p>
                  </div>
                )}

                {event.turma && (
                  <div className="rounded-2xl border border-border p-5">
                    <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Turma
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {event.turma.nome}
                    </p>
                  </div>
                )}

                {event.curso && (
                  <div className="rounded-2xl border border-border p-5">
                    <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Curso
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {event.curso.nome}
                    </p>
                  </div>
                )}

                {event.location && (
                  <div className="rounded-2xl border border-border p-5">
                    <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Local
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {event.location}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 border-t border-border bg-card px-7 py-5">
              <Button
                variant="outline"
                className="h-11 flex-1 rounded-2xl border-border bg-background/60 hover:bg-accent"
                disabled={event.source === "automatic"}
                onClick={onEdit}
              >
                Editar
              </Button>

              <Button
                variant="destructive"
                className="h-11 flex-1 rounded-2xl"
                disabled={event.source === "automatic" || deleting}
                onClick={onDelete}
              >
                Excluir
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}